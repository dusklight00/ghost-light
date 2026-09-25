import { useState, useCallback } from "react";
import { GameCanvas } from "./engine/GameCanvas.jsx";
import { DialogueBox } from "./ui/DialogueBox.jsx";
import { CutsceneScreen } from "./ui/CutsceneScreen.jsx";
import { MainMenu } from "./ui/MainMenu.jsx";
import { EndingScreen } from "./ui/EndingScreen.jsx";

import { act1TheRaid } from "./content/levels/act1_theRaid.js";
import { act2TheUndertow } from "./content/levels/act2_theUndertow.js";
import { act3TheArchive } from "./content/levels/act3_theArchive.js";
import { act4TheAmbush } from "./content/levels/act4_theAmbush.js";
import { act5Vault12 } from "./content/levels/act5_vault12.js";

import { act1Dialogue } from "./content/story/dialogue/act1.js";
import { act2Dialogue } from "./content/story/dialogue/act2.js";
import { act3Dialogue } from "./content/story/dialogue/act3.js";
import { act4Dialogue } from "./content/story/dialogue/act4.js";
import { act5Dialogue } from "./content/story/dialogue/act5.js";

// The whole campaign as a flat sequence of steps the player walks through in order. Each level
// step carries its own intro dialogue (played right before it) so the sequence reads top-to-bottom
// as the story. Act V is unique: its cutscene has a `before` and `after` half, split by the level.
const CAMPAIGN = [
  { type: "cutscene", lines: act1Dialogue.intro, background: "#1c1a22" },
  { type: "level", level: act1TheRaid, hint: "Move: WASD / Arrows — get to the steps." },
  { type: "cutscene", lines: act2Dialogue.intro, background: "#10151c" },
  { type: "level", level: act2TheUndertow, events: act2Dialogue.events, hint: "Move: WASD / Arrows   Aim: Mouse   Shoot: Hold Left Click" },
  { type: "cutscene", lines: act3Dialogue.intro, background: "#151018" },
  { type: "level", level: act3TheArchive, hint: "Move: WASD / Arrows   Aim: Mouse   Shoot: Hold Left Click" },
  { type: "cutscene", lines: act4Dialogue.intro, background: "#1a1010" },
  { type: "level", level: act4TheAmbush, hint: "Move: WASD / Arrows   Aim: Mouse   Shoot: Hold Left Click — get to the fallback exit" },
  { type: "cutscene", lines: act5Dialogue.before, background: "#0d0f14" },
  { type: "level", level: act5Vault12, hint: "Move: WASD / Arrows   Aim: Mouse   Shoot: Hold Left Click" },
  { type: "cutscene", lines: act5Dialogue.after, background: "#241c10" },
];

const EVENT_AUTO_HIDE_MS = 4000;

export function App() {
  const [screen, setScreen] = useState("menu"); // "menu" | "campaign" | "ending"
  const [stepIndex, setStepIndex] = useState(0);
  const [levelRunId, setLevelRunId] = useState(0);
  const [eventLine, setEventLine] = useState(null);

  const advance = useCallback(() => {
    setEventLine(null);
    setStepIndex(i => {
      const next = i + 1;
      if (next >= CAMPAIGN.length) {
        setScreen("ending");
        return i;
      }
      return next;
    });
  }, []);

  const retryLevel = useCallback(() => {
    setLevelRunId(id => id + 1);
  }, []);

  const restartCampaign = useCallback(() => {
    setStepIndex(0);
    setLevelRunId(id => id + 1);
    setScreen("campaign");
  }, []);

  if (screen === "menu") {
    return <MainMenu onStart={() => setScreen("campaign")} title="GHOSTLIGHT" />;
  }

  if (screen === "ending") {
    return <EndingScreen onRestart={restartCampaign} />;
  }

  const step = CAMPAIGN[stepIndex];

  if (step.type === "cutscene") {
    return <CutsceneScreen lines={step.lines} background={step.background} onComplete={advance} />;
  }

  // level step
  const handleEvent = name => {
    const lines = step.events?.[name];
    if (!lines || lines.length === 0) return;
    setEventLine(lines[0]);
    window.clearTimeout(handleEvent._t);
    handleEvent._t = window.setTimeout(() => setEventLine(null), EVENT_AUTO_HIDE_MS);
  };

  return (
    <>
      <GameCanvas
        key={`${stepIndex}-${levelRunId}`}
        levelDef={step.level}
        hint={step.hint}
        onWin={advance}
        onLose={retryLevel}
        onEvent={step.events ? handleEvent : undefined}
      />
      {eventLine && (
        <DialogueBox
          speaker={eventLine.speaker}
          text={eventLine.text}
          onAdvance={() => setEventLine(null)}
        />
      )}
    </>
  );
}
