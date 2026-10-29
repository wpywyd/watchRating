// Four visible indicators per criterion. Each earns 0–5 points (20 total).
export const rubric = {
  creativity: {
    originalForm: 'Distinctive, intentional shape or layout beyond a conventional watch template.',
    purposefulDetails: 'Specific original details that serve the design rather than decoration alone.',
    coherentConcept: 'A coherent visual concept carried through multiple visible elements.',
    thoughtfulSolution: 'An inventive, visibly communicated solution to a design need.'
  },
  appearance: {
    visualBalance: 'Intentional proportion and balance between the face, case and strap.',
    readableDial: 'A clear visual hierarchy and legible time display or equivalent interface.',
    colourContrast: 'Controlled colour or tonal contrast that supports the design.',
    consistentDetails: 'Consistent alignment, spacing and visual language across details.'
  },
  practicality: {
    interfaceClarity: 'Visible controls or display that clearly communicate their intended use.',
    wearableGeometry: 'Plausible visible proportions and geometry for wearing on a wrist.',
    strapConnection: 'Clearly resolved visible strap, attachment or fastening design.',
    purposeFit: 'Visible design decisions that support the intended use, without assuming operation.'
  },
  craftsmanship: {
    precision: 'Controlled linework, edges or construction appropriate to the detected stage.',
    detailResolution: 'Important details are deliberately resolved rather than left accidental.',
    consistency: 'Consistent treatment of repeated shapes, marks or assembled elements.',
    completeness: 'The design is communicated thoroughly for its stage, including key components.'
  }
};

export const scoringInstructions = `
STRICT, EVIDENCE-BASED RUBRIC:
Be encouraging in wording and exacting in marks. Do not award points for effort, positivity, the student's age, an attractive photograph, or merely depicting a watch. Never assume 70 is a minimum. Do not impose a quota of low or high scores, and do not subtract a fixed penalty from an otherwise justified score.
For each indicator below, return an integer from 0 to 5 in the criterion's points object:
0 = absent or visibly unresolved; 1 = minimal attempt with major weaknesses; 2 = basic or partly resolved, with substantial weaknesses; 3 = competent but ordinary, with identifiable room for improvement; 4 = strong, deliberately resolved, with only minor visible weaknesses; 5 = exceptional, with specific convincing visual evidence and no material visible weakness for this indicator.
Choose each indicator independently from the evidence. Four competent (3-point) indicators yield 60/100, not 70 or 80. The server computes each criterion as the sum of its four indicator points multiplied by 5, with a minimum of 1, and averages all four criteria for the overall score.
Score-band anchors: 1–39 needs substantial development; 40–59 developing; 60–69 competent; 70–79 strong; 80–89 excellent; 90–100 exceptional. A familiar conventional watch may be very well crafted but low in originality. A creative rough concept may score well for creativity and lower for visible resolution. Do not copy one criterion's impression into the others. A score of 70+ requires evidence beyond basic competence. 90+ requires consistently exceptional evidence across indicators.
Evaluate sketches and prototypes against stage-appropriate execution, not expensive materials, brand prestige, photorealism or working electronics. A sketch can earn high marks through precise intentional lines and resolved details. Student notes may clarify intent, but must not earn marks for claims, prose quality, length, or invisible features. For an obscured or unjudgeable indicator, use 2 as a provisional mark, explicitly explain the uncertainty, and request a clearer view; this is not evidence of poor work. If the photo is too unclear to support a meaningful review overall, return assessable:false and request a clearer photo rather than inventing marks.
In each criterion's feedback, cite concrete visible evidence for the awarded points and the main reason full marks were not earned, unless full marks are justified. Award 4 or 5 only when the photo provides specific supporting evidence. Never invent weaknesses to force a lower score.
INDICATORS:
${JSON.stringify(rubric)}
`;
