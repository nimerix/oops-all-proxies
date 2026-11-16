// One entry per colour scheme. Each drives its card back, icons, header and app colours.
// The first scheme is the default.
const goldFan = { fan: ["#A8842F", "#D2AC55", "#F3DC9A"], fanSmall: ["#D2AC55", "#FBEFC4"], accent: "#D9B45C" };
const goldCards = { cards: [["#F8E8B4", "#C2963C"]], cardLine: "#8A6A1F" };
// Ruby is second so the two cards that slipped out of the wheel are the red ones.
const jewelCards = {
  cards: [["#AB74EE", "#6A2FB8"], ["#EC5265", "#A81C30"], ["#F5B546", "#B8730F"], ["#3CC187", "#12754C"], ["#3FC4CE", "#12808C"], ["#5681F2", "#2440B0"]],
  cardLine: "#FFFFFF8C",
};

export const metal = ["#B48A30", "#F3DC9A", "#CBA046"];

// Roles that are the same in every scheme.
export const shared = {
  light: { bgPanel: "#F5F1E8", bgRaised: "#FFFDF8", text: "#1E1A14", textMuted: "#5F564A", textOnAccent: "#FFF8EA", border: "#DAD4C6", borderControl: "#867D6D", matGrid: "#FFFFFF1F", backdrop: "#17120CA8" },
  dark: { accent: "#D9B45C", accentHover: "#EACD82", textOnAccent: "#16130B", matGrid: "#FFFFFF14", backdrop: "#000000B3" },
  // The top bar is the scheme's leather in both themes.
  bar: { text: "#F4EBD3", muted: "#D3C9B5", border: "#D2AC5559", accent: "#D9B45C", accentHover: "#EACD82", textOnAccent: "#16130B", danger: "#FFB3AE" },
};

export const schemes = [
  {
    id: "midnight", label: "Midnight", tile: "#1D2152",
    fan: ["#B08A32", "#D9B45C", "#EC5265"], fanSmall: ["#D9B45C", "#F0606F"], accent: "#F0606F", accentOnLight: "#A81C30",
    back: { edge: "#10122E", panel: ["#333A88", "#252A68", "#1A1D4B"], band: "#12143A", well: ["#181B49", "#0B0D27"], cardEdge: "#080A1F", grain: [0.02, 0.02, 0.12], ...jewelCards },
    light: { accent: "#2B3894", accentHover: "#1D2152", accentSoft: "#E2E5F5", bgMat: "#262B63", textOnMatMuted: "#C8CBE6" },
    dark: { bgPanel: "#111330", bgRaised: "#1A1D42", bgMat: "#0B0D24", text: "#F0ECDF", textMuted: "#B6B7CF", textOnMatMuted: "#B6B7CF", border: "#2B2F5C", borderControl: "#7479A6", accentSoft: "#2B2E58" },
  },
  {
    id: "oxblood", label: "Oxblood", tile: "#5B1A21", ...goldFan,
    back: { edge: "#431218", panel: ["#812833", "#6A1F29", "#52171E"], band: "#47131A", well: ["#4A1218", "#2E080C"], cardEdge: "#3A0D12", grain: [0.1, 0.02, 0.02], ...goldCards },
    light: { accent: "#7A1F2B", accentHover: "#5B1A21", accentSoft: "#F3DFDB", bgMat: "#4B2126", textOnMatMuted: "#DCC9C4" },
    dark: { bgPanel: "#1B1211", bgRaised: "#281A19", bgMat: "#130B0B", text: "#F2E8D4", textMuted: "#BDAA9C", textOnMatMuted: "#BDAA9C", border: "#3D2A27", borderControl: "#917872", accentSoft: "#3B2521" },
  },
  {
    id: "leather", label: "Leather", tile: "#5A3A1F",
    fan: ["#B08A32", "#D9B45C", "#F0704A"], fanSmall: ["#D9B45C", "#F27A55"], accent: "#F27A55",
    back: { edge: "#2E1B0F", panel: ["#80552F", "#684324", "#4E3119"], band: "#3B2412", well: ["#3A2413", "#25150A"], cardEdge: "#2A180B", grain: [0.07, 0.04, 0.01], ...jewelCards },
    light: { accent: "#6B4322", accentHover: "#4E3119", accentSoft: "#EEE1CD", bgMat: "#4F3C29", textOnMatMuted: "#DACDBA" },
    dark: { bgPanel: "#18120D", bgRaised: "#251C14", bgMat: "#100B07", text: "#F1E7D0", textMuted: "#B8A88F", textOnMatMuted: "#B8A88F", border: "#3A2D20", borderControl: "#8C7961", accentSoft: "#392B19" },
  },
  {
    id: "forest", label: "Forest", tile: "#1F4A3A", ...goldFan,
    back: { edge: "#18392D", panel: ["#2E6650", "#245442", "#1A4032"], band: "#173A2D", well: ["#163628", "#0B2018"], cardEdge: "#0F2A20", grain: [0.02, 0.1, 0.06], ...goldCards },
    light: { accent: "#1F4A3A", accentHover: "#163628", accentSoft: "#E5E4D3", bgMat: "#2F4B41", textOnMatMuted: "#C9D6CF" },
    dark: { bgPanel: "#0F1814", bgRaised: "#18241E", bgMat: "#0A110E", text: "#EFEBDD", textMuted: "#AABCB1", textOnMatMuted: "#AABCB1", border: "#25362E", borderControl: "#70867A", accentSoft: "#20342A" },
  },
  {
    id: "black", label: "Black", tile: "#17171A", ...goldFan,
    back: { edge: "#000000", panel: ["#303036", "#232327", "#18181B"], band: "#101012", well: ["#1C1C20", "#070708"], cardEdge: "#050506", grain: [0.09, 0.09, 0.1], ...goldCards },
    light: { accent: "#1E1A14", accentHover: "#3B352C", accentSoft: "#E8E2D5", bgMat: "#2C2B2A", textOnMatMuted: "#D2CEC6" },
    dark: { bgPanel: "#0E0E0F", bgRaised: "#19191B", bgMat: "#060607", text: "#F0EBDF", textMuted: "#B3AFA7", textOnMatMuted: "#B3AFA7", border: "#2C2C2F", borderControl: "#7D7B78", accentSoft: "#2B2718" },
  },
];
