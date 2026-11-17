"""Independent exact-rational reference for the versioned money vectors (stdlib only)."""
import json
from fractions import Fraction
from pathlib import Path


def evaluate(vector):
    op = vector['op']
    if op == 'convert':
        rational = Fraction(int(vector['amount']) * int(vector['num']) * 10 ** vector['dq'],
                            int(vector['den']) * 10 ** vector['db'])
        return str(round(rational))
    if op == 'percent':
        return str(round(Fraction(int(vector['amount']) * int(vector['bps']), 10000)))
    if op == 'parse':
        return str(round(Fraction(vector['decimal']) * 10 ** vector['decimals']))
    if op == 'allocate':
        amount = int(vector['amount'])
        weights = vector['weights']
        ideal = [Fraction(abs(amount) * weight, sum(weights)) for weight in weights]
        parts = [part.numerator // part.denominator for part in ideal]
        order = sorted(range(len(parts)), key=lambda i: (-(ideal[i] - parts[i]), i))
        recipients = order[:abs(amount) - sum(parts)]
        for index in recipients:
            parts[index] += 1
        return {'parts': [str(part if amount >= 0 else -part) for part in parts],
                'remainderIndexes': recipients}
    raise ValueError('Unknown vector operation')


def main():
    path = Path(__file__).parent / 'vectors' / 'money.json'
    document = json.loads(path.read_text())
    assert document['format'] == 'classrup-money-vectors/v1'
    assert len(document['vectors']) >= 300
    for vector in document['vectors']:
        assert evaluate(vector) == vector['expected'], vector['id']
    print(f"{len(document['vectors'])} money vectors verified with Python Fraction; format v1; seed {document['seed']}")


if __name__ == '__main__':
    main()
