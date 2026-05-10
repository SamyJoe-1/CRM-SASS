// Core API types
export interface PaginatedResponse<T> { data: T[]; meta: { total: number; per_page: number; current_page: number; last_page: number; from: number; to: number } }
export interface ApiError { message: string; errors?: Record<string, string[]>; status?: number }
export interface PaginationParams { page?: number; per_page?: number; search?: string; sort_by?: string; sort_dir?: 'asc' | 'desc'; [key: string]: unknown }

// Auth
export interface User { id: string; name: string; email: string; role: UserRole; permissions: string[]; avatar?: string; employee_id?: string; tenant_id?: string; is_active: boolean; created_at: string; updated_at: string }
export type UserRole = 'super_admin' | 'admin' | 'hr_manager' | 'manager' | 'employee'
export interface LoginRequest { email: string; password: string }
export interface LoginResponse { user: User; access_token: string; refresh_token: string; expires_in: number }
export interface ForgotPasswordRequest { email: string }
export interface ResetPasswordRequest { token: string; email: string; password: string; password_confirmation: string }
export interface UpdateProfileRequest { name?: string; email?: string; avatar?: string }
export interface UpdatePasswordRequest { current_password: string; password: string; password_confirmation: string }

// Employee
export interface Employee extends Record<string, unknown> { id: string; employee_number: string; first_name: string; last_name: string; full_name: string; email: string; phone?: string; avatar?: string; department_id?: string; department?: { id: string; name: string }; position_id?: string; position?: { id: string; title: string }; manager_id?: string; manager?: { id: string; full_name: string }; employment_type: string; status: string; hire_date: string; termination_date?: string; date_of_birth?: string; gender?: string; nationality?: string; national_id?: string; address?: Record<string, string>; emergency_contact?: Record<string, string>; bank_details?: Record<string, string>; salary?: number; currency?: string; user_id?: string; tenant_id: string; created_at: string; updated_at: string }
export interface CreateEmployeeRequest { first_name: string; last_name: string; email: string; phone?: string; department_id?: string; position_id?: string; employment_type: string; hire_date: string; salary?: number; currency?: string }
export interface EmployeeDocument { id: string; employee_id: string; name: string; type: string; file_url: string; file_size?: number; mime_type?: string; uploaded_by: string; created_at: string }

// Attendance
export interface AttendanceRecord extends Record<string, unknown> { id: string; employee_id: string; employee?: { id: string; full_name: string; avatar?: string }; date: string; clock_in?: string; clock_out?: string; status: string; total_hours?: number; overtime_hours?: number; notes?: string; created_at: string; updated_at: string }
export interface AttendancePolicy { work_start_time: string; work_end_time: string; late_threshold_minutes: number; overtime_threshold_hours: number; allow_remote_clockin: boolean; require_location: boolean }
export interface AttendanceSummary { employee_id: string; period: string; total_days: number; present_days: number; absent_days: number; late_days: number; half_days: number; total_hours: number; overtime_hours: number }

// Leave
export interface LeaveType { id: string; name: string; code: string; days_per_year: number; carry_forward: boolean; max_carry_days?: number; requires_approval: boolean; color?: string; is_active: boolean }
export interface LeaveRequest extends Record<string, unknown> { id: string; employee_id: string; employee?: { id: string; full_name: string; avatar?: string }; leave_type_id: string; leave_type?: LeaveType; start_date: string; end_date: string; days: number; reason: string; status: string; approved_by?: string; approver?: { id: string; full_name: string }; rejection_reason?: string; created_at: string; updated_at: string }
export interface LeaveBalance { employee_id: string; leave_type_id: string; leave_type?: LeaveType; total_days: number; used_days: number; pending_days: number; remaining_days: number; year: number }

// Payroll
export interface PayrollCycle extends Record<string, unknown> { id: string; name: string; period_start: string; period_end: string; payment_date: string; status: string; total_employees: number; total_gross: number; total_deductions: number; total_net: number; currency: string; created_by: string; created_at: string; updated_at: string }
export interface PayrollRecord extends Record<string, unknown> { id: string; payroll_id: string; employee_id: string; employee?: { id: string; full_name: string; employee_number: string }; basic_salary: number; allowances: number; overtime_pay: number; bonuses: number; gross_salary: number; tax: number; insurance: number; other_deductions: number; total_deductions: number; net_salary: number; currency: string; status: string; notes?: string }
export interface Payslip extends Record<string, unknown> { id: string; employee_id: string; employee?: { id: string; full_name: string; employee_number: string; department?: { name: string } }; payroll_id: string; payroll?: { id: string; name: string; period_start: string; period_end: string }; basic_salary: number; allowances: number; overtime_pay: number; bonuses: number; gross_salary: number; tax: number; insurance: number; other_deductions: number; total_deductions: number; net_salary: number; currency: string; payment_date: string; status: string; viewed_at?: string; created_at: string }

// Performance
export interface PerformanceReview extends Record<string, unknown> { id: string; employee_id: string; employee?: { id: string; full_name: string; avatar?: string }; reviewer_id: string; reviewer?: { id: string; full_name: string }; review_period: string; period_start: string; period_end: string; status: string; overall_score?: number; criteria: ReviewCriteria[]; comments?: string; employee_acknowledgement?: boolean; submitted_at?: string; acknowledged_at?: string; created_at: string; updated_at: string }
export interface ReviewCriteria { id?: string; name: string; weight: number; score?: number; comment?: string }

// KPI
export interface KPI extends Record<string, unknown> { id: string; employee_id: string; employee?: { id: string; full_name: string }; title: string; description?: string; target_value: number; current_value: number; unit: string; start_date: string; end_date: string; status: string; category?: string; progress_history?: KPIProgress[]; created_at: string; updated_at: string }
export interface KPIProgress { id: string; kpi_id: string; value: number; notes?: string; recorded_at: string; recorded_by: string }

// Department & Position
export interface Department extends Record<string, unknown> { id: string; name: string; code?: string; description?: string; manager_id?: string; manager?: { id: string; full_name: string }; parent_id?: string; employee_count?: number; is_active: boolean; created_at: string }
export interface Position extends Record<string, unknown> { id: string; title: string; code?: string; department_id?: string; department?: { id: string; name: string }; description?: string; min_salary?: number; max_salary?: number; is_active: boolean; created_at: string }

// Other
export interface Announcement extends Record<string, unknown> { id: string; title: string; content: string; type: string; target_roles?: string[]; target_departments?: string[]; is_pinned: boolean; status: string; published_at?: string; author: { id: string; name: string }; created_at: string; updated_at: string }
export interface Notification extends Record<string, unknown> { id: string; title: string; message: string; type: string; read_at?: string; created_at: string; action_url?: string; data?: Record<string, unknown> }
export interface AuditLog extends Record<string, unknown> { id: string; user_id: string; user?: { id: string; name: string; email: string }; action: string; module: string; resource_id?: string; resource_type?: string; before?: Record<string, unknown>; after?: Record<string, unknown>; ip_address?: string; user_agent?: string; created_at: string }
export interface UserRecord extends Record<string, unknown> { id: string; name: string; email: string; role: string; is_active: boolean; permissions?: string[]; employee_id?: string; tenant_id?: string; last_login?: string; created_at: string }
export interface Tenant extends Record<string, unknown> { id: string; name: string; slug: string; domain?: string; status: string; plan?: string; employee_count?: number; admin_email?: string; created_at: string; updated_at: string }
export interface AnalyticsOverview { total_employees: number; active_employees: number; on_leave_today: number; pending_leave_requests: number; attendance_rate: number; total_payroll_this_month: number; new_hires_this_month: number; open_positions: number }
export interface GeneralSettings { company_name: string; company_email: string; company_phone?: string; timezone: string; date_format: string; currency: string; fiscal_year_start: string }
export interface PayrollSettings { pay_frequency: string; tax_rate: number; insurance_rate: number; overtime_rate: number; currency: string; payment_method: string }
export interface Role { id: string; name: string; slug: string; description?: string; permissions: string[]; is_system: boolean; created_at: string }
