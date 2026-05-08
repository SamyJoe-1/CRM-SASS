const path         = require('path');
const fs           = require('fs');
const PDFDocument  = require('pdfkit');
const db           = require('../../config/database');
const { NotFoundError, ForbiddenError } = require('../../utils/AppError');
const { getPagination, buildMeta }      = require('../../utils/pagination');

const listAll = async (tenantId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const base = () => db('payslips')
    .where({ 'payslips.tenant_id': tenantId })
    .leftJoin('employees','employees.id','payslips.employee_id')
    .leftJoin('payroll_records','payroll_records.id','payslips.payroll_record_id')
    .leftJoin('payroll_cycles','payroll_cycles.id','payroll_records.cycle_id');

  const data = await base()
    .select('payslips.*','employees.first_name','employees.last_name','employees.employee_number',
            'payroll_cycles.year','payroll_cycles.month','payroll_records.net_salary','payroll_records.gross_salary')
    .orderBy('payroll_cycles.year','desc').orderBy('payroll_cycles.month','desc')
    .limit(per_page).offset(offset);

  const [{ count }] = await base().count('payslips.id as count');
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const listOwn = async (tenantId, userId, query) => {
  const { page, per_page, offset } = getPagination(query);
  const emp = await db('employees').where({ tenant_id: tenantId, user_id: userId, deleted_at: null }).first();
  if (!emp) throw new NotFoundError('Employee profile not found');

  const base = () => db('payslips')
    .where({ 'payslips.tenant_id': tenantId, 'payslips.employee_id': emp.id })
    .leftJoin('payroll_records','payroll_records.id','payslips.payroll_record_id')
    .leftJoin('payroll_cycles','payroll_cycles.id','payroll_records.cycle_id');

  const data = await base()
    .select('payslips.*','payroll_cycles.year','payroll_cycles.month','payroll_records.net_salary','payroll_records.gross_salary')
    .orderBy('payroll_cycles.year','desc').orderBy('payroll_cycles.month','desc')
    .limit(per_page).offset(offset);

  const [{ count }] = await base().count('payslips.id as count');
  return { data, meta: buildMeta(page, per_page, Number(count)) };
};

const getPayslip = async (tenantId, id, user) => {
  const payslip = await db('payslips')
    .where({ 'payslips.id': id, 'payslips.tenant_id': tenantId })
    .leftJoin('payroll_records','payroll_records.id','payslips.payroll_record_id')
    .leftJoin('payroll_cycles','payroll_cycles.id','payroll_records.cycle_id')
    .leftJoin('employees','employees.id','payslips.employee_id')
    .select('payslips.*','payroll_records.*','payroll_cycles.year','payroll_cycles.month','employees.first_name','employees.last_name','employees.employee_number','employees.work_email')
    .first();

  if (!payslip) throw new NotFoundError('Payslip not found');

  if (user.role_name === 'employee') {
    const emp = await db('employees').where({ tenant_id: tenantId, user_id: user.id }).first();
    if (!emp || emp.id !== payslip.employee_id) throw new ForbiddenError();
  }
  return payslip;
};

const generatePDF = async (payslip, tenant) => {
  return new Promise((resolve) => {
    const pdfDir = path.join(process.cwd(), 'uploads', 'payslips');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const filePath = path.join(pdfDir, `payslip-${payslip.id}.pdf`);

    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(tenant ? tenant.name : 'Company', { align:'center' });
    doc.fontSize(14).font('Helvetica').text('PAYSLIP', { align:'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Employee info
    doc.fontSize(10).font('Helvetica-Bold').text('Employee Information');
    doc.font('Helvetica')
       .text(`Name: ${payslip.first_name} ${payslip.last_name}`)
       .text(`Employee #: ${payslip.employee_number}`)
       .text(`Period: ${payslip.month}/${payslip.year}`);
    doc.moveDown();

    // Earnings table
    doc.font('Helvetica-Bold').text('EARNINGS', { underline: true });
    const earnings = [
      ['Base Salary',   payslip.base_salary],
      ['Allowances',    payslip.allowances],
      ['Overtime Pay',  payslip.overtime_pay],
      ['Bonus',         payslip.bonus],
    ];
    earnings.forEach(([label, val]) => {
      doc.font('Helvetica').text(`  ${label}`, { continued:true }).text(`${Number(val||0).toFixed(2)}`, { align:'right' });
    });
    doc.font('Helvetica-Bold').text('  Gross Salary', { continued:true }).text(`${Number(payslip.gross_salary||0).toFixed(2)}`, { align:'right' });
    doc.moveDown();

    // Deductions table
    doc.font('Helvetica-Bold').text('DEDUCTIONS', { underline: true });
    const deductions = [
      ['Tax',                payslip.tax_amount],
      ['Insurance',          payslip.insurance_amount],
      ['Absence Deduction',  payslip.absence_deduction],
      ['Other Deductions',   payslip.other_deductions],
    ];
    deductions.forEach(([label, val]) => {
      doc.font('Helvetica').text(`  ${label}`, { continued:true }).text(`${Number(val||0).toFixed(2)}`, { align:'right' });
    });
    doc.font('Helvetica-Bold').text('  Total Deductions', { continued:true }).text(`${Number(payslip.total_deductions||0).toFixed(2)}`, { align:'right' });
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text('NET SALARY', { continued:true }).text(`${Number(payslip.net_salary||0).toFixed(2)}`, { align:'right' });

    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
};

const downloadPDF = async (tenantId, id, user) => {
  const payslip = await getPayslip(tenantId, id, user);
  const pdfPath = path.join(process.cwd(), 'uploads', 'payslips', `payslip-${id}.pdf`);

  if (!fs.existsSync(pdfPath)) {
    const tenant = await db('tenants').where({ id: tenantId }).first();
    await generatePDF(payslip, tenant);
  }

  // update pdf_url & mark generated
  await db('payslips').where({ id }).update({ pdf_url:`/uploads/payslips/payslip-${id}.pdf`, updated_at:new Date().toISOString() });
  return pdfPath;
};

const markViewed = async (tenantId, id, userId) => {
  const payslip = await db('payslips').where({ id, tenant_id: tenantId }).first();
  if (!payslip) throw new NotFoundError('Payslip not found');
  const now = new Date().toISOString();
  await db('payslips').where({ id }).update({ viewed_by_employee:true, viewed_at:now, updated_at:now });
};

module.exports = { listAll, listOwn, getPayslip, downloadPDF, markViewed };
