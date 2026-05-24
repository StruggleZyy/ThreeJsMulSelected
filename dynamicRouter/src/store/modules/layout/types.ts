interface dataObject {
  id: number;
  name: string;
}

export interface infoListObject {
  test?: dataObject & { testCode: string };
  testWorkCondition?: dataObject;
  testMeasurement?: dataObject;
}

export interface layoutState {
  selectedKey: string;
  infoList: infoListObject;
  breadcrumbEndStrArr: string[];
  reflash: boolean;
}