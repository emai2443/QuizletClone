// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://escalhcpfkorzvdozabi.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY2FsaGNwZmtvcnp2ZG96YWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMjg2MzcsImV4cCI6MjA2MTgwNDYzN30.XuSIXJHawFBHf38gx1a78cBDuI9eMIoNhROnNMd4Wmc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
