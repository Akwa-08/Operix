const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sfwautdzybvolctmtbhx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmd2F1dGR6eWJ2b2xjdG10Ymh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzE4NzksImV4cCI6MjA4NjIwNzg3OX0.yo___hT2JdkAkq5Ml1PSdr5aFAvERbKzddmJL8IdW9I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: emps } = await supabase.from('employees').select('id, full_name').ilike('full_name', '%adon%');
  if (!emps || emps.length === 0) {
    console.log('No employee found with name Adon');
    return;
  }
  const adon = emps[0];
  console.log('Found employee:', adon);

  const { data: records } = await supabase
    .from('payroll_records')
    .select(`
      id,
      payroll_period_id,
      days_present,
      basic_pay,
      gross_income,
      total_deductions,
      net_pay,
      carry_over_deduction,
      carry_over_from_previous,
      cash_advance,
      cash_advance_issued,
      sss,
      philhealth,
      hdmf,
      created_at,
      payroll_periods (
        period_start,
        period_end
      )
    `)
    .eq('employee_id', adon.id)
    .order('created_at', { ascending: true });

  console.log('Payroll records for Adon:');
  console.log(JSON.stringify(records, null, 2));
}

main();
