import { writeFileSync } from 'fs';

const envContent = `VITE_SUPABASE_URL=https://oiaofdufyanysebbspky.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pYW9mZHVmeWFueXNlYmJzcGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzQ5OTcsImV4cCI6MjA3MDgxMDk5N30.CXJrMD4_i0bKXjJYgqHevDJGQKvL7e9ccEzer7voUt8
`;

writeFileSync('.env', envContent);
console.log('.env file created successfully!');


