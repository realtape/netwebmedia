import json, sys

filepath = '_deploy/guides-queue/gpt4o-image-generation-ad-creative.json'

with open(filepath, 'r', encoding='utf-8') as f:
    raw = f.read()

def fix_json_strings(s):
    out = []
    in_string = False
    i = 0
    while i < len(s):
        c = s[i]
        backslash = chr(92)
        if c == backslash and in_string:
            out.append(c)
            i += 1
            if i < len(s):
                out.append(s[i])
                i += 1
            continue
        if c == '"':
            if not in_string:
                in_string = True
                out.append(c)
            else:
                rest = s[i+1:]
                stripped = rest.lstrip(' \t\r\n')
                if not stripped or stripped[0] in ':,}]':
                    in_string = False
                    out.append(c)
                else:
                    out.append(backslash + '"')
        else:
            out.append(c)
        i += 1
    return ''.join(out)

fixed = fix_json_strings(raw)

try:
    json.loads(fixed)
    print('Fixed JSON is valid')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(fixed)
    print('Saved.')
except json.JSONDecodeError as e:
    print(f'Still invalid at pos {e.pos}: {e.msg}')
    start = max(0, e.pos - 80)
    end = min(len(fixed), e.pos + 80)
    print(repr(fixed[start:end]))
    sys.exit(1)
