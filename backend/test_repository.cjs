const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

supabase.from('repository').select('*').then(({data, error}) => {
  if (error) {
    console.error(error);
  } else {
    console.log("Count:", data.length);
    console.log(JSON.stringify(data.slice(0, 2), null, 2));
  }
});
