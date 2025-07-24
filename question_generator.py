import random
import json
from collections import defaultdict
from pathlib import Path

# ──────────────────────────────────────────────────────────────
#  Difficulty‑scoring helpers  (UNCHANGED)
# ──────────────────────────────────────────────────────────────
def addition_difficulty(num1, num2):
    s1, s2 = str(int(num1)), str(int(num2))
    base = min(len(s1), len(s2)) * 0.5
    max_len = max(len(s1), len(s2))
    p1, p2 = s1.zfill(max_len), s2.zfill(max_len)
    carry = carry_count = 0
    for i in range(max_len - 1, -1, -1):
        s = int(p1[i]) + int(p2[i]) + carry
        if s >= 10:
            carry_count += 1
            carry = s // 10
        else:
            carry = 0
    return base + carry_count * 0.75

def subtraction_difficulty(num1, num2):
    a, b = sorted((int(num1), int(num2)))
    base = len(str(a)) * 0.5
    p_small, p_big = str(a).zfill(len(str(b))), str(b).zfill(len(str(b)))
    borrow = borrow_count = 0
    for i in range(len(p_big) - 1, -1, -1):
        top = int(p_big[i]) - borrow
        if top < int(p_small[i]):
            borrow_count += 1
            borrow = 1
        else:
            borrow = 0
    return base + borrow_count * 0.75

def multiply_one_digit_by_number(digit, number):
    s = str(int(number))
    chunk_diff = 0
    partials = []
    for i in range(len(s) - 1, -1, -1):
        chunk_diff += 0.5
        partials.append(digit * int(s[i]) * (10 ** ((len(s) - 1) - i)))
    total, add_diff = 0, 0
    for p in partials:
        if total == 0:
            total = p
        else:
            add_diff += addition_difficulty(total, p)
            total += p
    return {'numeric': total, 'difficulty': chunk_diff + add_diff}

def decompose_into_tens(n):
    s = str(int(n))
    return [
        {'core': int(ch), 'zeroCount': len(s) - 1 - i}
        for i, ch in enumerate(s) if ch != '0'
    ]

def compute_multiplication_difficulty(A, B):
    chunks = decompose_into_tens(A)
    subtotal = 0
    partial_vals = []
    for c in chunks:
        res = multiply_one_digit_by_number(c['core'], B)
        subtotal += res['difficulty']
        partial_vals.append(res['numeric'] * (10 ** c['zeroCount']))
    total, add_diff = 0, 0
    for v in partial_vals:
        if total == 0:
            total = v
        else:
            add_diff += addition_difficulty(total, v)
            total += v
    return {'finalResult': total, 'difficulty': subtotal + add_diff}

def get_factor(d):
    d = int(d)
    if d < 10:
        return d
    tens = int(str(d)[0]) * 10
    return (tens + 10 if int(str(d)[1]) >= 5 else tens) / 10

def handle_chunk(chunk_val, divisor, state):
    c, d = int(chunk_val), int(divisor)
    if c < d:
        return c
    if not state['factoring_used']:
        if d > 9:
            state['difficulty'] += 0.25
        state['factoring_used'] = True
    factor = d if d < 10 else get_factor(d)
    if c < 10 and factor < 10:
        state['difficulty'] += 0.5
        return 0
    if factor < 10 and c <= factor * 10:
        state['difficulty'] += 1
        return 0
    M = max(1, c // factor)
    prev = None
    while True:
        mul = compute_multiplication_difficulty(M, d)
        state['difficulty'] += mul['difficulty']
        prod = mul['finalResult']
        if prod == c:
            return 0
        if prod < c:
            prev = mul
            M += 1
        else:
            if prev is None:
                return c
            state['difficulty'] += subtraction_difficulty(c, prev['finalResult'])
            return c - prev['finalResult']

def compute_full_division_difficulty(dividend, divisor):
    state = {'difficulty': 0, 'factoring_used': False}
    rem = 0
    for ch in str(int(dividend)):
        rem = rem * 10 + int(ch)
        if rem >= divisor:
            rem = handle_chunk(rem, divisor, state)
    return state['difficulty']

def calculate_difficulty(a, b, op):
    a, b = int(a), int(b)
    if op == '+':
        return {'result': a + b, 'difficulty': addition_difficulty(a, b)}
    if op == '-':
        return {'result': a - b, 'difficulty': subtraction_difficulty(a, b)}
    if op == '*':
        m = compute_multiplication_difficulty(a, b)
        return {'result': m['finalResult'], 'difficulty': m['difficulty']}
    if op == '/':
        return {'result': a // b, 'difficulty': compute_full_division_difficulty(a, b)}
    raise ValueError("Invalid op")

def get_divisors(n):
    n = int(n)
    return [i for i in range(2, n) if n % i == 0] if n > 1 else []

def wrap_if_needed(expr, op):
    if any(sym in expr for sym in ['+', '-']) and op in ['*', '/']:
        return f"({expr})"
    return expr

# ──────────────────────────────────────────────────────────────
#  Seed‑driven generator
# ──────────────────────────────────────────────────────────────
def generate_expression(rng: random.Random):
    while True:
        expr = str(rng.randint(1, 100))
        res  = int(expr)
        diff = 0.0
        ops  = 0
        used_factors = {res}

        while ops < 4:
            op = rng.choice(['+', '-', '*', '/'])
            if op == '+':
                nxt = rng.randint(1, 100)
            elif op == '-':
                if res == 0:
                    break
                nxt = rng.randint(1, res)
            elif op == '*':
                while True:
                    nxt = rng.randint(2, 20)
                    if nxt not in used_factors:
                        used_factors.add(nxt)
                        break
            else:  # division
                divs = [d for d in get_divisors(res) if d not in used_factors]
                if not divs:
                    break
                nxt = rng.choice(divs)
                used_factors.add(nxt)

            step = calculate_difficulty(res, nxt, op)
            diff += step['difficulty']
            res = step['result']

            expr = f"{wrap_if_needed(expr, op)} {op} {nxt}"
            ops += 1
            if ops >= 1 and rng.random() >= 0.4:
                break

        if ops and diff <= 30:
            diff *= 1.1 ** max(0, ops - 1)
            return expr, res, diff, ops

# ──────────────────────────────────────────────────────────────
#  Rebuild helper
# ──────────────────────────────────────────────────────────────
def rebuild_question(level, seed):
    rng = random.Random(seed)
    expr, ans, diff, _ = generate_expression(rng)
    assert int(round(diff)) == level
    return expr, ans, round(diff, 2)

# ──────────────────────────────────────────────────────────────
#  MAIN: build a 3 000‑question index
# ──────────────────────────────────────────────────────────────
def main():
    MAX_PER_LEVEL = 100           # 100 × 30 = 3 000 total
    LEVELS = range(1, 31)
    outfile = Path("question_index_small.jsonl")

    counts = defaultdict(int)
    seed   = 0

    with outfile.open("w") as fout:
        while len(counts) < 30 or any(v < MAX_PER_LEVEL for v in counts.values()):
            rng = random.Random(seed)
            _, _, diff, _ = generate_expression(rng)
            lvl = int(round(diff))

            if lvl in LEVELS and counts[lvl] < MAX_PER_LEVEL:
                fout.write(json.dumps({"level": lvl, "seed": seed}) + "\n")
                counts[lvl] += 1
            seed += 1

    print(f"Done: wrote {sum(counts.values())} pairs to {outfile}")

    # show three sample level‑10 questions
    demo = 0
    with outfile.open() as f:
        for line in f:
            rec = json.loads(line)
            if rec["level"] == 10:
                expr, ans, diff = rebuild_question(rec["level"], rec["seed"])
                print(f"  {expr} = {ans}  (difficulty {diff})")
                demo += 1
                if demo == 3:
                    break

if __name__ == "__main__":
    main()
