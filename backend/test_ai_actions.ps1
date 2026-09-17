$ErrorActionPreference = "Continue"
$url = "https://cxiicvirllfdvcjwwcbj.supabase.co/functions/v1/ai-actions"

function Test-Action($name, $payload) {
  Write-Output "=============================================="
  Write-Output "CASE: $name"
  $file = "C:\Users\shubh\AppData\Local\Temp\opencode\ai_action.json"
  Set-Content -Path $file -Value $payload -NoNewline -Encoding UTF8
  $out = curl.exe -s -X POST $url -H "Content-Type: application/json" --data-binary "@$file"
  Write-Output $out
  Write-Output ""
}

Test-Action "alarm one-time" '{"prompt":"set an alarm for 7am tomorrow morning called Morning run"}'

Test-Action "alarm repeating days" '{"prompt":"remind me every monday and wednesday at 6:30 in the morning to go to the gym"}'

Test-Action "create class" '{"prompt":"add Data Structures CSE201 on Monday 9:00 to 10:30 in room 204 taught by Dr Rao"}'

Test-Action "parse timetable" '{"prompt":"here is my timetable:\nMon 9:00-10:30 Data Structures CSE201 Room 204\nMon 11:00-12:30 Linear Algebra MTH101\nWed 2:00pm-3:30pm Operating Systems CSE301 Lab 3","categories":["classes"]}'

Test-Action "plain chat (expect no actions)" '{"prompt":"what is the difference between a stack and a queue?"}'

Test-Action "delete class" '{"prompt":"remove my Linear Algebra class","context":{"classes":[{"course_name":"Linear Algebra","course_code":"MTH101","day":"Monday","start_time":"11:00","end_time":"12:30"}]}}'
