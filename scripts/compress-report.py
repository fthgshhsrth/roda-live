"""Compress a saved tool report locally; never sends a model/API request."""
import json
import os
import sys
from pathlib import Path

os.environ['HEADROOM_OFFLINE'] = '1'
from headroom import compress

source = Path(sys.argv[1])
text = source.read_text(encoding='utf-8-sig')
messages = [
    {'role': 'user', 'content': 'Preserve failures and the final test totals. Summarize this tool report.'},
    {'role': 'assistant', 'content': None, 'tool_calls': [
        {'id': 'report', 'type': 'function', 'function': {'name': 'test_report', 'arguments': '{}'}}]},
    {'role': 'tool', 'tool_call_id': 'report', 'content': text},
]
result = compress(messages, model='gpt-4o')
output = source.with_suffix('.compressed.json')
output.write_text(json.dumps(result.messages, ensure_ascii=False, default=str), encoding='utf-8')
summary = {'tokens_before': result.tokens_before, 'tokens_after': result.tokens_after,
           'tokens_saved': result.tokens_saved, 'output': str(output)}
assert result.tokens_after <= result.tokens_before, 'Compression expanded the report'
assert any(message.get('role') == 'user' for message in result.messages), 'User instruction lost'
print(json.dumps(summary, ensure_ascii=False))
