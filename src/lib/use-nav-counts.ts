"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchBuildingProjects, fetchSavedProblems } from "./user-client";

export function useNavCounts() {
  const [savedCount, setSavedCount] = useState(0);
  const [buildingCount, setBuildingCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [saved, building] = await Promise.all([
        fetchSavedProblems(),
        fetchBuildingProjects(),
      ]);
      setSavedCount(saved.length);
      setBuildingCount(building.length);
    } catch {
      setSavedCount(0);
      setBuildingCount(0);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { savedCount, buildingCount, refresh };
}
