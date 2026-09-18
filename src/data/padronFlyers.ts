export interface PadronFlyerOption {
  cedula: string;
  fileName: string;
  label: string;
}

export const DISTRICT_FLYER_FILE_NAMES = {
  ARROYITO: "ARROYITO.jpg",
  LOMA_PLATA: "LOMA PLATA.jpg",
  TTE_IRALA: "TTE IRALA.jpg",
} as const;

export const DEFAULT_PADRON_FLYER_FILE_NAME = "000.jpeg";

export const PADRON_FLYER_OPTIONS: PadronFlyerOption[] = [
  { cedula: "928167", fileName: "928167.jpg", label: "Cedula 928167" },
  { cedula: "954806", fileName: "954806.jpg", label: "Cedula 954806" },
  { cedula: "1003231", fileName: "1003231.jpg", label: "Cedula 1003231" },
  { cedula: "1162734", fileName: "1162734.jpg", label: "Cedula 1162734" },
  { cedula: "1302629", fileName: "1302629.jpg", label: "Cedula 1302629" },
  { cedula: "1515537", fileName: "1515537.jpg", label: "Cedula 1515537" },
  { cedula: "1739908", fileName: "1739908.jpg", label: "Cedula 1739908" },
  { cedula: "2077544", fileName: "2077544.jpg", label: "Cedula 2077544" },
  { cedula: "2088920", fileName: "2088920.jpg", label: "Cedula 2088920" },
  { cedula: "2180874", fileName: "2180874.jpg", label: "Cedula 2180874" },
  { cedula: "2493806", fileName: "2493806.jpg", label: "Cedula 2493806" },
  { cedula: "2884034", fileName: "2884034.jpg", label: "Cedula 2884034" },
  { cedula: "2944454", fileName: "2944454.jpg", label: "Cedula 2944454" },
  { cedula: "2953442", fileName: "2953442.jpg", label: "Cedula 2953442" },
  { cedula: "3431429", fileName: "3431429.jpg", label: "Cedula 3431429" },
  { cedula: "3464564", fileName: "3464564.jpg", label: "Cedula 3464564" },
  { cedula: "3517744", fileName: "3517744.jpg", label: "Cedula 3517744" },
  { cedula: "3523705", fileName: "3523705.jpg", label: "Cedula 3523705" },
  { cedula: "3525631", fileName: "3525631.jpg", label: "Cedula 3525631" },
  { cedula: "3630043", fileName: "3630043.jpg", label: "Cedula 3630043" },
  { cedula: "3659367", fileName: "3659367.jpg", label: "Cedula 3659367" },
  { cedula: "3715884", fileName: "3715884.jpg", label: "Cedula 3715884" },
  { cedula: "3752086", fileName: "3752086.jpg", label: "Cedula 3752086" },
  { cedula: "3863219", fileName: "3863219.jpg", label: "Cedula 3863219" },
  { cedula: "3907012", fileName: "3907012.jpg", label: "Cedula 3907012" },
  { cedula: "3913644", fileName: "3913644.jpg", label: "Cedula 3913644" },
  { cedula: "3946832", fileName: "3946832.jpg", label: "Cedula 3946832" },
  { cedula: "4002173", fileName: "4002173.jpg", label: "Cedula 4002173" },
  { cedula: "4027700", fileName: "4027700.jpg", label: "Cedula 4027700" },
  { cedula: "4074405", fileName: "4074405.jpg", label: "Cedula 4074405" },
  { cedula: "4275036", fileName: "4275036.jpg", label: "Cedula 4275036" },
  { cedula: "4365222", fileName: "4365222.jpg", label: "Cedula 4365222" },
  { cedula: "4549898", fileName: "4549898.jpg", label: "Cedula 4549898" },
  { cedula: "4626379", fileName: "4626379.jpg", label: "Cedula 4626379" },
  { cedula: "4651755", fileName: "4651755.jpg", label: "Cedula 4651755" },
  { cedula: "1129293", fileName: "1129293.jpeg", label: "Cedula 1129293" },
  { cedula: "4970250", fileName: "4970250.jpg", label: "Cedula 4970250" },
  { cedula: "5015433", fileName: "5015433.jpg", label: "Cedula 5015433" },
  { cedula: "5116903", fileName: "5116903.jpg", label: "Cedula 5116903" },
  { cedula: "5391641", fileName: "5391641.jpg", label: "Cedula 5391641" },
  { cedula: "5470795", fileName: "5470795.jpg", label: "Cedula 5470795" },
  { cedula: "5476246", fileName: "5476246.jpg", label: "Cedula 5476246" },
  { cedula: "5560892", fileName: "5560892.jpg", label: "Cedula 5560892" },
  { cedula: "5586712", fileName: "5586712.jpg", label: "Cedula 5586712" },
  { cedula: "5732509", fileName: "5732509.jpg", label: "Cedula 5732509" },
  { cedula: "5947809", fileName: "5947809.jpg", label: "Cedula 5947809" },
  { cedula: "6009857", fileName: "6009857.jpg", label: "Cedula 6009857" },
  { cedula: "6159903", fileName: "6159903.jpg", label: "Cedula 6159903" },
  { cedula: "6190042", fileName: "6190042.jpg", label: "Cedula 6190042" },
];

export function buildFlyerUrl(fileName: string) {
  return `/flyers/${encodeURIComponent(fileName)}`;
}
