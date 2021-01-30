import { player, format, formatTimeShort } from './Synergism';
import Decimal, { DecimalSource } from 'break_infinity.js';
import { antSacrificePointsToMultiplier } from './Ants';
import { Synergism } from './Events';

export type Category = 'ants' | 'reset' | 'ascend';
export type Kind = 'antsacrifice' | 'prestige' | 'transcend' | 'reincarnate' | 'ascend';

// Common to every kind
type ResetHistoryEntryBase = {
    date: number
    seconds: number
    kind: Kind
};

export type ResetHistoryEntryAntSacrifice = ResetHistoryEntryBase & {
    antSacrificePointsAfter: number
    antSacrificePointsBefore: number
    baseELO: number
    crumbs: string
    crumbsPerSecond: string
    effectiveELO: number
    obtainium: number
    offerings: number
    kind: 'antsacrifice'
};

export type ResetHistoryEntryPrestige = ResetHistoryEntryBase & {
    offerings: number
    diamonds: string
    kind: 'prestige'
}
export type ResetHistoryEntryTranscend = ResetHistoryEntryBase & {
    offerings: number
    mythos: string
    kind: 'transcend'
}
export type ResetHistoryEntryReincarnate = ResetHistoryEntryBase & {
    offerings: number
    particles: string
    obtainium: number
    kind: 'reincarnate'
}

export type ResetHistoryEntryAscend = ResetHistoryEntryBase & {
    c10Completions: number
    usedCorruptions: number[]
    corruptionScore: number
    wowCubes: number
    wowTesseracts: number
    wowHypercubes: number
    wowPlatonicCubes: number
    currentChallenge?: number
    kind: 'ascend'
}

export type ResetHistoryEntryUnion =
    ResetHistoryEntryAntSacrifice
    | ResetHistoryEntryPrestige
    | ResetHistoryEntryTranscend
    | ResetHistoryEntryReincarnate
    | ResetHistoryEntryAscend

// A formatter that allows formatting a string. The string should be in a form parsable by break_infinity.js.
const formatStringOrNumber = (numOrStr: number | Decimal | string) => {
    return format(typeof numOrStr === "string" ? new Decimal(numOrStr) : numOrStr);
}

// A formatter that, if given a number, allows the data to be divided by the amount of seconds spent.
const conditionalFormatPerSecond = (numOrStr: number | Decimal | string, data: ResetHistoryEntryBase) => {
    if (typeof numOrStr === "string") {
        numOrStr = parseFloat(numOrStr);
    }
    if (typeof (numOrStr) === "number" && player.historyShowPerSecond) {
        if (numOrStr === 0) { // work around format(0, 3) return 0 instead of 0.000, for consistency
            return "0.000/s";
        }
        return format(numOrStr / ((data.seconds && data.seconds > 0) ? data.seconds : 1), 3, true) + "/s";
    }
    return format(numOrStr);
}

const historyGains: Record<
    string,
    {
        img: string
        imgTitle: string
        formatter: (str: DecimalSource, data: ResetHistoryEntryUnion) => string,
        onlyif?: (data: ResetHistoryEntryUnion) => boolean
    }
> = {
    offerings: {
        img: "Pictures/Offering.png", 
        formatter: formatStringOrNumber,
        imgTitle: "Offerings"
    },
    obtainium: {
        img: "Pictures/Obtainium.png", 
        formatter: formatStringOrNumber,
        imgTitle: "Obtainium"
    },
    antMulti: {
        img: "Pictures/AntSacrifice.png", 
        formatter: formatStringOrNumber,
        imgTitle: "Ant Multiplier gains"
    },
    particles: {
        img: "Pictures/Particle.png",
        formatter: formatStringOrNumber,
        imgTitle: "Particles"
    },
    diamonds: {
        img: "Pictures/Diamond.png",
        formatter: formatStringOrNumber,
        imgTitle: "Diamonds"
    },
    mythos: {
        img: "Pictures/Mythos.png",
        formatter: formatStringOrNumber,
        imgTitle: "Mythos"
    },
    wowTesseracts: {
        img: "Pictures/WowTessaract.png",
        formatter: conditionalFormatPerSecond,
        imgTitle: "Wow! Tesseracts"
    },
    wowHypercubes: {
        img: "Pictures/WowHypercube.png",
        formatter: conditionalFormatPerSecond,
        imgTitle: "Wow! Hypercubes",
        onlyif: () => player.challengecompletions[13] > 0
    },
    wowCubes: {
        img: "Pictures/WowCube.png",
        formatter: conditionalFormatPerSecond,
        imgTitle: "Wow! Cubes"
    },
    wowPlatonicCubes: {
        img: "Pictures/Platonic Cube.png",
        formatter: conditionalFormatPerSecond,
        imgTitle: "Platonic Cubes",
        onlyif: () => player.challengecompletions[14] > 0,
    },
};

const historyGainsOrder = [
    "offerings", "obtainium",
    "antMulti",
    "particles", "diamonds", "mythos",
    "wowCubes", "wowTesseracts", "wowHypercubes", "wowPlatonicCubes",
];

const historyKinds: Record<Kind, { img: string }> = {
    "antsacrifice": {img: "Pictures/AntSacrifice.png"},
    "prestige": {img: "Pictures/Transparent Pics/Prestige.png"},
    "transcend": {img: "Pictures/Transparent Pics/Transcend.png"},
    "reincarnate": {img: "Pictures/Transparent Pics/Reincarnate.png"},
    "ascend": {img: "Pictures/questionable.png"},
};

const resetHistoryTableMapping = {
    "ants": "historyAntsTable",
    "reset": "historyResetTable",
    "ascend": "historyAscendTable",
};

const resetHistoryCorruptionImages = [
    "Pictures/Divisiveness Level 7.png",
    "Pictures/Maladaption Lvl 7.png",
    "Pictures/Laziness Lvl 7.png",
    "Pictures/Hyperchallenged Lvl 7.png",
    "Pictures/Scientific Illiteracy Lvl 7.png",
    "Pictures/Deflation Lvl 7.png",
    "Pictures/Extinction Lvl 7.png",
    "Pictures/Drought Lvl 7.png",
    "Pictures/Financial Collapse Lvl 7.png"
];

const resetHistoryCorruptionTitles = [
    "Divisiveness [Multipliers]",
    "Maladaption [Accelerators]",
    "Spacial Dilation [Time]",
    "Hyperchallenged [Challenge Requirements]",
    "Scientific Illiteracy [Obtainium]",
    "Market Deflation [Diamonds]",
    "Extinction [Ants]",
    "Drought [Offering EXP]",
    "Financial Recession [Coins]"
];

// A formatting aid that removes the mantissa from a formatted string. Converts "2.5e1000" to "e1000".
const extractStringExponent = (str: string) => {
    let m: RegExpMatchArray | null = null;
    return (m = str.match(/e\+?(.+)/)) !== null ? `e${m[1]}` : str;
}

const resetHistoryAdd = (category: Category, data: ResetHistoryEntryUnion) => {
    if (player.history[category] === undefined) {
        player.history[category] = [];
    }

    while (player.history[category].length > (player.historyCountMax - 1)) {
        player.history[category].shift();
    }

    player.history[category].push(data);
    resetHistoryPushNewRow(category, data);
}

Synergism.on('historyAdd', resetHistoryAdd);

const resetHistoryPushNewRow = (category: Category, data: ResetHistoryEntryUnion) => {
    const row = resetHistoryRenderRow(category, data);
    const table = document.getElementById(resetHistoryTableMapping[category]);
    const tbody = table.querySelector("tbody");
    tbody.insertBefore(row, tbody.childNodes[0]);
    while (tbody.childNodes.length > player.historyCountMax) {
        tbody.removeChild(tbody.lastChild);
    }
}

const resetHistoryRenderRow = (
    _category: Category, 
    data: ResetHistoryEntryUnion
) => {
    let colsUsed = 1;
    const row = document.createElement("tr");
    let rowContentHtml = "";

    const kindMeta = historyKinds[data.kind];

    const localDate = new Date(data.date).toLocaleString();
    rowContentHtml += `<td class="history-seconds" title="${localDate}"><img src="${kindMeta.img}">${formatTimeShort(data.seconds, 60)}</td>`;

    const gains = [];
    for (let gainIdx = 0; gainIdx < historyGainsOrder.length; ++gainIdx) {
        const showing = historyGainsOrder[gainIdx];
        // TODO: Rework this code so we don't have to any
        const lolLmao = data as any;
        if (Object.prototype.hasOwnProperty.call(data, showing)) {
            const gainInfo = historyGains[showing as keyof typeof historyGains];
            if (gainInfo.onlyif && !gainInfo.onlyif(data)) {
                continue;
            }
            const formatter = gainInfo.formatter || (() => {/* If no formatter is specified, don't display. */});
            const str = `<img src="${gainInfo.img}" title="${gainInfo.imgTitle || ''}">${formatter(lolLmao[showing], data)}`;

            gains.push(str);
        }
    }

    const extra: string[] = [];
    if (data.kind === "antsacrifice") {
        const entry = data as ResetHistoryEntryAntSacrifice;
        const oldMulti = antSacrificePointsToMultiplier(entry.antSacrificePointsBefore);
        const newMulti = antSacrificePointsToMultiplier(entry.antSacrificePointsAfter);
        const diff = newMulti - oldMulti;
        extra.push(
            `<span title="Ant Multiplier: ${format(oldMulti, 3, false)}--&gt;${format(newMulti, 3, false)}"><img src="Pictures/Multiplier.png" alt="Ant Multiplier">+${format(diff, 3, false)}</span>`,
            `<span title="+${formatStringOrNumber(entry.crumbsPerSecond)} crumbs/s"><img src="Pictures/GalacticCrumbs.png" alt="Crumbs">${extractStringExponent(formatStringOrNumber(entry.crumbs))}</span>`,
            `<span title="${format(data.baseELO)} base"><img src="Pictures/Transparent Pics/ELO.png" alt="ELO">${format(data.effectiveELO)}</span>`
        );
    } else if (data.kind === "ascend") {
        const entry = data as ResetHistoryEntryAscend;
        extra.push(
            `<img src="Pictures/Transparent Pics/ChallengeTen.png" title="Challenge 10 completions">${entry.c10Completions}`
        );

        const corruptions = resetHistoryFormatCorruptions(entry);
        if (corruptions !== null) {
            extra.push(corruptions[0]);
            extra.push(corruptions[1]);
        }
    }

    // This rendering is done this way so that all rows should have the same number of columns, which makes rows
    // equal size and prevents bad rendering. We do 2 of these so that the history doesn't shift when
    // hypercubes or platcubes get added as players unlock them.
    // The 6 and 4 numbers are arbitrary but should never be less than the actual amount of columns that can be
    // realistically displayed; you can increase them if more gains are added.

    // Render the gains plus the gains filler
    colsUsed += gains.length;
    rowContentHtml += gains.reduce((acc, value) => {
        return `${acc}<td class="history-gain">${value}</td>`;
    }, "");
    rowContentHtml += `<td class="history-filler" colspan="${6 - colsUsed}"></td>`;

    // Render the other stuff
    rowContentHtml += extra.reduce((acc, value) => {
        return `${acc}<td class="history-extra">${value}</td>`;
    }, "");
    rowContentHtml += `<td class="history-filler" colspan="${4 - extra.length}"></td>`;

    row.innerHTML = rowContentHtml;
    return row;
}

const resetHistoryRenderFullTable = (categoryToRender: Category, targetTable: HTMLElement) => {
    const tbody = targetTable.querySelector("tbody");
    tbody.innerHTML = "";

    if (!player.history[categoryToRender]) {
        return;
    }

    if (player.history[categoryToRender].length > 0) {
        for (let i = player.history[categoryToRender].length - 1; i >= 0; --i) {
            const row = resetHistoryRenderRow(categoryToRender, player.history[categoryToRender][i]);
            tbody.appendChild(row);
        }
    }
}
export const resetHistoryRenderAllTables = () => {
    (Object.keys(resetHistoryTableMapping) as Category[]).forEach(
        key => resetHistoryRenderFullTable(key, document.getElementById(resetHistoryTableMapping[key]))
    );
}

export const resetHistoryTogglePerSecond = () => {
    player.historyShowPerSecond = !player.historyShowPerSecond;
    resetHistoryRenderAllTables();
    const button = document.getElementById("historyTogglePerSecondButton");
    button.textContent = "Per second: " + (player.historyShowPerSecond ? "ON" : "OFF");
    button.style.borderColor = player.historyShowPerSecond ? "green" : "red";
}

const resetHistoryFormatCorruptions = (data: ResetHistoryEntryAscend): [string, string] => {
    let score = "Score: " + format(data.corruptionScore, 0, true);
    let corruptions = "";
    for (let i = 0; i < resetHistoryCorruptionImages.length; ++i) {
        const corruptionIdx = i + 1;
        if (corruptionIdx in data.usedCorruptions && data.usedCorruptions[corruptionIdx] !== 0) {
            corruptions += ` <img src="${resetHistoryCorruptionImages[i]}" title="${resetHistoryCorruptionTitles[i]}">${data.usedCorruptions[corruptionIdx]}`;
        }
    }
    if (data.currentChallenge !== undefined) {
        score += ` / C${data.currentChallenge}`;
    }

    return [score, corruptions];
}
