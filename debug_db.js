
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kephfwfqtazehbqegxdv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGhmd2ZxdGF6ZWhicWVneGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTc4OTEsImV4cCI6MjA4NjgzMzg5MX0.Bo8MjS95kHrCcTrcemY_DzABblp7ijwLjkzlu2mMym0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('--- TEST 1: Simple Select ---');
    const { data: simpleData, error: simpleError } = await supabase
        .from('academy_members')
        .select('*')
        .limit(1);

    if (simpleError) {
        console.error('Test 1 Failed:', JSON.stringify(simpleError, null, 2));
    } else {
        console.log('Test 1 Success. Data:', simpleData);
    }

    console.log('\n--- TEST 2: Join Select ---');
    const { data: joinData, error: joinError } = await supabase
        .from('academy_members')
        .select(`
        academy_id,
        academies (
            id,
            name
        )
    `)
        .limit(1);

    if (joinError) {
        console.error('Test 2 Failed:', JSON.stringify(joinError, null, 2));
    } else {
        console.log('Test 2 Success. Data:', joinData);
    }
}

debug();
