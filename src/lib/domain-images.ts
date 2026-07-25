// Curated Unsplash photo IDs per domain — each pool has 6+ images to avoid repeats
const DOMAIN_PHOTOS: Record<string, string[]> = {
  Health: [
    "1576091160550-2173dba999ef",
    "1584820927498-cad076eee68c",
    "1559757148-5c350d0d3c56",
    "1532938911079-1b06ac7ceec7",
    "1530497610245-768d11f7ed16",
    "1538108149393-dbfdef7e7470",
  ],
  "Dev Tools": [
    "1555066931-4365d14bab8c",
    "1461749280684-dccba630e2f6",
    "1537432376769-00f5c2f4c8d2",
    "1593720213428-28a5b9e94613",
    "1498050108023-c5249f4df085",
    "1516116216624-53ad0571bc55",
  ],
  FinTech: [
    "1611974789855-9c2a0a7236a3",
    "1551288049-bebda4e38f71",
    "1559526324-4b87b5e36e44",
    "1579621970795-87facc2f976d",
    "1526304640581-d334cdbbf45e",
    "1563013544-824ae1b704d3",
  ],
  EdTech: [
    "1503676260728-1c00da094a0b",
    "1509062522246-3755977927d7",
    "1522202176988-66273c2fd55f",
    "1456513080510-7bf3a84b82f8",
    "1434030216411-0b793f4b4173",
    "1488190211105-8b0e65b80b4e",
  ],
  Climate: [
    "1421789665209-c9b2a435e3dc",
    "1473341304170-971dccb5ac1e",
    "1465925508512-1e7052bb62e6",
    "1508193638397-1c4234db14d8",
    "1497435334941-8c899ee9e8e9",
    "1518173946687-a4c8892bbd9f",
  ],
  CleanTech: [
    "1509391366360-2e959784a276",
    "1466611653911-0265b984d6a1",
    "1548337138-e87d889cc369",
    "1532601224476-15c79f2f7a51",
    "1521618755640-4e33e5b4a2f2",
    "1600880292203-757bb62b4baf",
  ],
  "Mental Health": [
    "1499209974431-9dddcece7f88",
    "1506126613408-eca07ce68773",
    "1474116811902-5e5a8a5e8c1c",
    "1545389336-cf090694435e",
    "1520637836993-a70d9c3e03e3",
    "1544367948-0b748a7afb6d",
  ],
  AgriTech: [
    "1500937386664-56d1dfef3854",
    "1464226184884-fa280b87c399",
    "1574943320219-553eb213f72d",
    "1416879595882-3373a0480b5b",
    "1558618666-fcd25c85cd64",
    "1628352081506-83c65e2f9573",
  ],
  Housing: [
    "1560448204-e02f11c3d0e2",
    "1512917774080-9991f1c4c750",
    "1600585154340-be6161a56a0c",
    "1600566752355-35792bedcfea",
    "1582268611958-ebfd161ef9cf",
    "1549517045-bc93de630367",
  ],
  Infrastructure: [
    "1518770660439-4636190af475",
    "1558494949-ef010cbdcc31",
    "1544197150-b99a580bb7a8",
    "1616628188859-7a11abb6fcc9",
    "1451187580459-43490279c0fa",
    "1573164713714-d95e436ab8d7",
  ],
  LegalTech: [
    "1589829545856-d10d557cf95f",
    "1575505586569-646b2ca898fc",
    "1453945284-73cac80aa6e9",
    "1505664194779-8beaceb422d4",
    "1450101499163-c8848c66ca85",
    "1521587760476-6982bf3dc8a1",
  ],
  "Civic Tech": [
    "1477959858617-67f85cf4f1df",
    "1480714378408-67cf0d13bc1b",
    "1449824913935-59a10b8d2000",
    "1486325212027-8081e485255e",
    "1529107386315-e1a2410a5a20",
    "1519501025264-65ba15a82390",
  ],
  Accessibility: [
    "1573496359142-b8d87734a5a2",
    "1582213782179-e0d53f98f2ca",
    "1488521787991-ed7bbaae773c",
    "1531482615713-2afd69097998",
    "1455849318743-b2233052fcff",
    "1559757175-0eb58430eb7b",
  ],
  Other: [
    "1519389950473-47ba0277781c",
    "1451187580459-43490279c0fa",
    "1485827404703-89b55fcc595e",
    "1518770660439-4636190af475",
    "1559825481-12a05cc00344",
    "1507003211169-0a1dd7228f2d",
  ],
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getDomainImage(domain: string, problemId: string): string {
  const pool = DOMAIN_PHOTOS[domain] ?? DOMAIN_PHOTOS.Other;
  const idx = hashStr(problemId) % pool.length;
  const photoId = pool[idx];
  return `https://images.unsplash.com/photo-${photoId}?w=600&h=280&fit=crop&auto=format&q=75`;
}

// Keep gradient as fallback
export const DOMAIN_GRADIENTS: Record<string, string> = {
  Health: "linear-gradient(135deg, #1B3A6B 0%, #4A90D9 100%)",
  "Dev Tools": "linear-gradient(135deg, #0A0A0A 0%, #434343 100%)",
  AgriTech: "linear-gradient(135deg, #2D6A4F 0%, #95D5B2 100%)",
  FinTech: "linear-gradient(135deg, #1B3A6B 0%, #52B788 100%)",
  EdTech: "linear-gradient(135deg, #7B2D8B 0%, #C77DFF 100%)",
  LegalTech: "linear-gradient(135deg, #444440 0%, #888884 100%)",
  Climate: "linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)",
  Accessibility: "linear-gradient(135deg, #B45309 0%, #FBBF24 100%)",
  Housing: "linear-gradient(135deg, #BE123C 0%, #FB7185 100%)",
  Infrastructure: "linear-gradient(135deg, #434343 0%, #9CA3AF 100%)",
  "Civic Tech": "linear-gradient(135deg, #0369A1 0%, #38BDF8 100%)",
  "Mental Health": "linear-gradient(135deg, #7B2D8B 0%, #E879F9 100%)",
  CleanTech: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)",
  Other: "linear-gradient(135deg, #1B3A6B 0%, #4A90D9 100%)",
};

export function getDomainGradient(domain: string): string {
  return DOMAIN_GRADIENTS[domain] ?? "linear-gradient(135deg, #1B3A6B 0%, #4A90D9 100%)";
}
