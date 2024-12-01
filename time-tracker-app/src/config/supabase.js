import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mazxuhyvawwpvicwnyzd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1henh1aHl2YXd3cHZpY3dueXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1NTI3OTUsImV4cCI6MjA0ODEyODc5NX0.qIUKcId4SKUa4TBIoUtlwAZ6rsHreT-Zf1chEynXjL8';

export const supabase = createClient(supabaseUrl, supabaseKey); 