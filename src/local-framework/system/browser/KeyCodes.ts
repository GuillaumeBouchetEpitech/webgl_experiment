export const AllKeyCodes = {
  // Numbers and letters
  Num0: 48,
  Num1: 49,
  Num2: 50,
  Num3: 51,
  Num4: 52,
  Num5: 53,
  Num6: 54,
  Num7: 55,
  Num8: 56,
  Num9: 57,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,

  // Punctuations keys in US layout
  Semicolon: 186,
  Equal: 187,
  Comma: 188,
  Minus: 189,
  Period: 190,
  BackQuote: 192,
  BracketLeft: 219,
  Backslash: 220,
  BracketRight: 221,
  Quote: 222,

  // Modifier keys
  Shift: 16,
  Ctrl: 17,
  Alt: 18,
  CapsLock: 20,

  // Control keys
  Tab: 9,
  Enter: 13,
  Pause: 19,
  Escape: 27,
  Space: 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  PrintScreen: 44,
  Insert: 45,
  Delete: 46,
  ContextMenu: 93,
  ScrollLock: 145,

  // Function keys
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  F13: 124,
  F14: 125,
  F15: 126,
  F16: 127,
  F17: 128,
  F18: 129,
  F19: 130,
  F20: 131,
  F21: 132,
  F22: 133,
  F23: 134,
  F24: 135,

  // Numpad keys
  NumPad0: 96,
  NumPad1: 97,
  NumPad2: 98,
  NumPad3: 99,
  NumPad4: 100,
  NumPad5: 101,
  NumPad6: 102,
  NumPad7: 103,
  NumPad8: 104,
  NumPad9: 105,
  NumPadMultiply: 106,
  NumPadAdd: 107,
  NumPadSubtract: 109,
  NumPadDecimal: 110,
  NumPadDivide: 111,
  NumLock: 144,
  NumPadComma: 194,
  NumPadEqual: 12
};

export const isLetter = (key: number) => {
  return key >= AllKeyCodes.A && key <= AllKeyCodes.Z;
};

export const isNumber = (key: number) => {
  return (
    (key >= AllKeyCodes.Num0 && key <= AllKeyCodes.Num9) ||
    (key >= AllKeyCodes.NumPad0 && key <= AllKeyCodes.NumPad9)
  );
};

export const isAlphanumeric = (key: number) => {
  return isNumber(key) || isLetter(key);
};
