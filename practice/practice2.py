from gtts import gTTS
from playsound import playsound
import time
import os

# Read navigation instructions
with open("instruction.txt", "r", encoding="utf-8") as file:
    instructions = [line.strip() for line in file if line.strip()]

print("\n🎯 Starting voice-guided navigation...\n")

for i, instruction in enumerate(instructions, start=1):
    print(f"🗺️ Step {i}/{len(instructions)}: {instruction}")

    # Use unique filename for each instruction
    filename = f"temp_instruction_{i}.mp3"
    tts = gTTS(instruction, lang='en')
    tts.save(filename)

    playsound(filename)
    time.sleep(2)

    # Optional: delete after playing
    os.remove(filename)

print("\n✅ Navigation complete!")
