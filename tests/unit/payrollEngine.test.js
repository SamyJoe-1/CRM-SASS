const { calculatePayroll } = require('../../src/utils/payrollEngine');

describe('calculatePayroll', () => {
  const baseEmployee = { base_salary: 10000, allowances: 500 };
  const baseCycle    = { year: 2024, month: 1 };
  const baseAttendance = { working_days: 22, absent_days: 0, overtime_minutes: 0 };

  it('computes gross salary correctly', () => {
    const result = calculatePayroll({ employee:baseEmployee, cycle:baseCycle, attendanceSummary:baseAttendance });
    expect(result.gross_salary).toBe(10500);
  });

  it('deducts absence correctly', () => {
    const result = calculatePayroll({ employee:baseEmployee, cycle:baseCycle, attendanceSummary:{ ...baseAttendance, absent_days:2 } });
    const expected = (10000 / 22) * 2;
    expect(result.absence_deduction).toBeCloseTo(expected, 1);
  });

  it('net salary is gross minus total deductions', () => {
    const result = calculatePayroll({ employee:baseEmployee, cycle:baseCycle, attendanceSummary:baseAttendance });
    expect(result.net_salary).toBeCloseTo(result.gross_salary - result.total_deductions, 1);
  });

  it('net salary is never negative', () => {
    const result = calculatePayroll({ employee:{ base_salary:0, allowances:0 }, cycle:baseCycle, attendanceSummary:{ ...baseAttendance, absent_days:22 } });
    expect(result.net_salary).toBeGreaterThanOrEqual(0);
  });

  it('calculates overtime pay', () => {
    const result = calculatePayroll({ employee:baseEmployee, cycle:baseCycle, attendanceSummary:{ ...baseAttendance, overtime_minutes:120 } });
    expect(result.overtime_pay).toBeGreaterThan(0);
  });
});
