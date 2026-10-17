export type DatasMap = Map<string, string>;

function iso(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function addDias(ano: number, mes: number, dia: number, delta: number) {
  const d = new Date(ano, mes - 1, dia + delta);
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function pascoa(ano: number) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return { mes, dia };
}

function enesimoDomingo(ano: number, mes: number, n: number) {
  const primeiro = new Date(ano, mes - 1, 1).getDay();
  return 1 + ((7 - primeiro) % 7) + (n - 1) * 7;
}

function blackFriday(ano: number) {
  const primeiro = new Date(ano, 10, 1).getDay();
  const quinta = 1 + ((4 - primeiro + 7) % 7) + 21;
  return quinta + 1;
}

export function datasComemorativas(ano: number): DatasMap {
  const mapa: DatasMap = new Map();

  function add(data: string, nome: string) {
    const atual = mapa.get(data);
    mapa.set(data, atual ? `${atual} · ${nome}` : nome);
  }

  add(iso(ano, 1, 1), "Ano Novo");
  add(iso(ano, 3, 8), "Dia da Mulher");
  add(iso(ano, 3, 15), "Dia do Consumidor");
  add(iso(ano, 4, 21), "Tiradentes");
  add(iso(ano, 5, 1), "Dia do Trabalho");
  add(iso(ano, 5, enesimoDomingo(ano, 5, 2)), "Dia das Mães");
  add(iso(ano, 6, 12), "Dia dos Namorados");
  add(iso(ano, 8, enesimoDomingo(ano, 8, 2)), "Dia dos Pais");
  add(iso(ano, 9, 7), "Independência");
  add(iso(ano, 9, 15), "Dia do Cliente");
  add(iso(ano, 10, 12), "Dia das Crianças");
  add(iso(ano, 10, 15), "Dia do Professor");
  add(iso(ano, 10, 31), "Halloween");
  add(iso(ano, 11, 2), "Finados");
  add(iso(ano, 11, 15), "Proclamação da República");
  add(iso(ano, 11, 20), "Consciência Negra");
  add(iso(ano, 11, blackFriday(ano)), "Black Friday");
  add(iso(ano, 12, 25), "Natal");
  add(iso(ano, 12, 31), "Réveillon");

  const p = pascoa(ano);
  add(iso(ano, p.mes, p.dia), "Páscoa");
  add(addDias(ano, p.mes, p.dia, -2), "Sexta-feira Santa");
  add(addDias(ano, p.mes, p.dia, -47), "Carnaval");

  return mapa;
}