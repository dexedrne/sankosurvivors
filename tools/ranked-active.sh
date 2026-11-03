#!/bin/bash
# How many ranked runs are in progress right now (prints a number, or exits 1 if it cannot tell). Reads the reports key from
# ~/.config/sankosurvivors/reports.env (outside the repo); never prints it. Used by tools/deploy.sh to queue ranked updates.
set -e
set -a; . "$HOME/.config/sankosurvivors/reports.env"; set +a
OUT=$(curl -s -m 20 -X POST "$SUPABASE_URL/rest/v1/rpc/sqs_ranked_active" -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H 'Content-Type: application/json' -d "{\"p_key\":\"$SQS_REPORTS_KEY\"}")
printf %s "$OUT" | python3 -c 'import json,sys; d=json.load(sys.stdin); n=d.get("active") if isinstance(d,dict) else None; assert isinstance(n,int); print(n)'
