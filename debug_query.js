
const { createClient } = require('@supabase/supabase-js');

// Config from .env.local
const supabaseUrl = 'https://kephfwfqtazehbqegxdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGhmd2ZxdGF6ZWhicWVneGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTc4OTEsImV4cCI6MjA4NjgzMzg5MX0.Bo8MjS95kHrCcTrcemY_DzABblp7ijwLjkzlu2mMym0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuery() {
    console.log('--- DIAGNOSTIC CHECK ---');

    // 1. Check Academies (Baseline)
    console.log('\n1. Checking existing table (academies)...');
    const { data: academies, error: academiesError } = await supabase
        .from('academies')
        .select('id')
        .limit(1);

    if (academiesError) {
        console.error('❌ Academies check FAILED:', academiesError.code, academiesError.message);
    } else {
        console.log('✅ Academies check PASSED. Table exists.');
    }

    // 2. Check Attendance Sessions
    console.log('\n2. Checking new table (attendance_sessions)...');
    const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .limit(1);

    if (attendanceError) {
        console.error('❌ Attendance check FAILED:', attendanceError.code, attendanceError.message);
        console.log('   (PGRST205 means the table hasn\'t been created or is not exposed via API)');
    } else {
        console.log('✅ Attendance check PASSED. Table exists.');
    }
}

checkQuery();
