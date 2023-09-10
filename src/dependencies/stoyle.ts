/* eslint-disable lines-between-class-members */

import {
  DecorationCode,
  ForegroundRgbCode,
  ForegroundSimpleCode,
  stoyle,
  stoyleGlobal,
  stoyleString,
  Style,
  styleToAnsiCode,
} from 'https://raw.githubusercontent.com/quilicicf/Stoyle/0.2.0/mod.ts';

const cyan = new ForegroundRgbCode(102, 217, 239);
const green = new ForegroundRgbCode(166, 226, 46);
const red = new ForegroundRgbCode(249, 38, 114);
const yellow = new ForegroundRgbCode(230, 219, 116);
const purple = new ForegroundRgbCode(174, 129, 255);
// const pink = new ForegroundRgbCode(255, 0, 198);

const theme: { [ key: string ]: Style } = {
  // Generic
  dim: { decoration: DecorationCode.Dim },
  strong: { decoration: DecorationCode.Bold },
  emphasis: { decoration: DecorationCode.Italic },
  error: { color: ForegroundSimpleCode.FG_Red },
  warning: { color: ForegroundSimpleCode.FG_Yellow },
  success: { color: ForegroundSimpleCode.FG_Green },
  link: { color: ForegroundSimpleCode.FG_Blue, decoration: DecorationCode.Underline },

  status: { color: ForegroundSimpleCode.FG_Cyan },
};

export const RESET_CODE = styleToAnsiCode({}, true);

export {
  stoyle, stoyleGlobal, stoyleString, theme,
};
