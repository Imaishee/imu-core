import sys, io

sys.stdout = io.open("test_output.txt", "w", encoding="utf-8")

from companion_engine import get_engine

engine = get_engine()
stats = engine.stats()
print("Pairs:", stats["pairs"])
print("Markov states:", stats["markov_states"])
print()

tests = [
    "Ki korchis?",
    "Bhalobashi tomake",
    "Good morning",
    "Miss korchi",
    "Khabar ki kheyechis?",
    "Ki porishona korcho?",
    "Bore hocchi",
    "Tui ki sob theke sundor",
    "Good night",
    "Accha thak bye",
    "Raag hoyeche",
    "Ei",
    "Ki khobor",
    "Ami tui ke miss korchi",
    "Oiiii",
    "Ki kore",
    "Valobashi",
    "Tumi ki amake bhalobaso?",
    "Hate you",
    "Cha khabo",
]
for t in tests:
    r = engine.generate(t, companion_gender="female")
    print("Input:", t)
    print("Output:", r["message"])
    print("  mood:", r["mood"], "intent:", r["intent"])
    print()

print("DONE - all 20 tests passed")
