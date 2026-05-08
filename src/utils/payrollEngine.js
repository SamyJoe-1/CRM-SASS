const { DateTime } = require('luxon');

/**
 * Calculate all payroll figures for one employee in one cycle.
 */
const calculatePayroll = ({ employee, cycle, attendanceSummary, payrollConfig }) => {
  const {
    base_salary,
    allowances     = 0,
  } = employee;

  const {
    bonus             = 0,
    other_deductions  = 0,
  } = payrollConfig || {};

  const {
    working_days      = 22,
    absent_days       = 0,
    overtime_minutes  = 0,
  } = attendanceSummary || {};

  // overtime rate: 1.5x hourly
  const hourlyRate        = base_salary / (working_days * 8);
  const overtimePay       = (overtime_minutes / 60) * hourlyRate * 1.5;

  const grossSalary       = Number(base_salary) + Number(allowances) + overtimePay + Number(bonus);

  // tax brackets (configurable via payrollConfig.tax_brackets)
  const taxBrackets = (payrollConfig && payrollConfig.tax_brackets)
    ? JSON.parse(payrollConfig.tax_brackets)
    : [
        { upTo: 5000,  rate: 0    },
        { upTo: 10000, rate: 0.10 },
        { upTo: 20000, rate: 0.15 },
        { upTo: Infinity, rate: 0.20 },
      ];

  let taxAmount    = 0;
  let remaining    = grossSalary;
  let prevUpTo     = 0;
  for (const bracket of taxBrackets) {
    if (remaining <= 0) break;
    const taxable  = Math.min(remaining, bracket.upTo - prevUpTo);
    taxAmount     += taxable * bracket.rate;
    remaining     -= taxable;
    prevUpTo       = bracket.upTo;
  }

  const insuranceRate   = (payrollConfig && payrollConfig.insurance_rate) ? parseFloat(payrollConfig.insurance_rate) : 0.11;
  const insuranceCap    = (payrollConfig && payrollConfig.insurance_cap)  ? parseFloat(payrollConfig.insurance_cap)  : 50000;
  const insuranceAmount = Math.min(grossSalary * insuranceRate, insuranceCap * insuranceRate);

  const absenceDeduction = (Number(base_salary) / working_days) * Number(absent_days);

  const totalDeductions = taxAmount + insuranceAmount + absenceDeduction + Number(other_deductions);
  const netSalary       = Math.max(0, grossSalary - totalDeductions);

  return {
    base_salary:       Number(base_salary),
    allowances:        Number(allowances),
    overtime_pay:      round2(overtimePay),
    bonus:             Number(bonus),
    gross_salary:      round2(grossSalary),
    tax_amount:        round2(taxAmount),
    insurance_amount:  round2(insuranceAmount),
    absence_deduction: round2(absenceDeduction),
    other_deductions:  Number(other_deductions),
    total_deductions:  round2(totalDeductions),
    net_salary:        round2(netSalary),
    working_days,
    absent_days,
    overtime_minutes,
  };
};

const round2 = (n) => Math.round(n * 100) / 100;

module.exports = { calculatePayroll };
