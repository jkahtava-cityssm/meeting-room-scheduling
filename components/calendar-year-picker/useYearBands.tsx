import { useMemo } from "react";

export function useYearBands(selectedYear: number, yearsPerBand: number = 16, totalBandsToGenerate: number = 9) {
  if (yearsPerBand <= 0) {
    throw new Error("yearsPerBand must be greater than 0");
  }

  if (selectedYear <= 0) {
    throw new Error("selectedYear must be greater than 0");
  }

  if (totalBandsToGenerate <= 0) {
    throw new Error("totalBandsToGenerate must be greater than 0");
  }

  const bands = useMemo(() => {
    const previousBandsToGenerate = Math.floor(totalBandsToGenerate / 2);

    const startYear = selectedYear - ((selectedYear - 1) % yearsPerBand);

    return Array.from({ length: totalBandsToGenerate }, (_, i) => {
      const bandStartYear = startYear + (i - previousBandsToGenerate) * yearsPerBand;
      return Array.from({ length: yearsPerBand }, (_, j) => bandStartYear + j);
    });
  }, [selectedYear, yearsPerBand, totalBandsToGenerate]);

  const yearList = useMemo(() => {
    return bands.find((band) => selectedYear >= band[0] && selectedYear <= band[band.length - 1]) || [];
  }, [bands, selectedYear]);

  const bandLabel = useMemo(() => {
    return yearList.length ? `${yearList[0]} - ${yearList[yearList.length - 1]}` : "";
  }, [yearList]);

  const getBandLabel = (band: number[]) => `${band[0]} - ${band[band.length - 1]}`;

  const isYearInBlock = (year: number, band: number[]) => year >= band[0] && year <= band[band.length - 1];

  return {
    bands,
    yearList,
    bandLabel,
    getBandLabel,
    isYearInBlock,
  };
}
