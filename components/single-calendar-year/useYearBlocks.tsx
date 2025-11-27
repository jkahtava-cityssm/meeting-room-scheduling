import { useMemo } from "react";

export function useYearBlocks(selectedYear: number, blockSize: number = 16, totalBlocks: number = 9) {
  const blocks = useMemo(() => {
    const safeBlockSize = Math.max(1, Math.floor(blockSize));
    const safeTotalBlocks = Math.max(1, Math.floor(totalBlocks));
    const beforeBlocks = Math.floor(safeTotalBlocks / 2);

    const startYear = selectedYear - ((selectedYear - 1) % safeBlockSize);

    return Array.from({ length: safeTotalBlocks }, (_, i) => {
      const blockStartYear = startYear + (i - beforeBlocks) * safeBlockSize;
      return Array.from({ length: safeBlockSize }, (_, j) => blockStartYear + j);
    });
  }, [selectedYear, blockSize, totalBlocks]);

  const currentBlock = useMemo(() => {
    return blocks.find((block) => selectedYear >= block[0] && selectedYear <= block[block.length - 1]) || [];
  }, [blocks, selectedYear]);

  const currentBlockLabel = useMemo(() => {
    return currentBlock.length ? `${currentBlock[0]} - ${currentBlock[currentBlock.length - 1]}` : "";
  }, [currentBlock]);

  const getBlockLabel = (block: number[]) => `${block[0]} - ${block[block.length - 1]}`;

  const isYearInBlock = (year: number, block: number[]) => year >= block[0] && year <= block[block.length - 1];

  return {
    blocks,
    currentBlock,
    currentBlockLabel,
    getBlockLabel,
    isYearInBlock,
  };
}
