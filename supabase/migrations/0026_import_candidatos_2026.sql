-- Importa la planilla candidatos2026.xlsx.
-- La fuente incluye cedula; se cruza con padron para completar territorio y snapshot.

with incoming (
  source_row,
  numero_orden,
  numero_lista,
  cedula,
  nombre_candidato,
  departamento_excel,
  ciudad_excel,
  cargo
) as (
  values
    ('6', '4', '5', '3616375', 'ORLANDO RENE MIGLIO FERREIRA', 'ITAPUA', 'ENCARNACION', 'Concejal/Titular'),
    ('7', '2', '5', '2953442', 'ALCIDES RUBEN AYALA CENTURION', 'ITAPUA', 'CARMEN DEL PARANA', 'Concejal/Titular'),
    ('8', '8', '5', '4275036', 'LAZARO CHAVEZ', 'ITAPUA', 'CARMEN DEL PARANA', 'Concejal/Titular'),
    ('9', '1', '5', '4074405', 'ALBERTO DELVALLE MARTINEZ', 'ITAPUA', 'YATYTAY', 'Concejal/Titular'),
    ('10', '4', '5', '5179176', 'NOELIA MABEL LAMBARE VEGA', 'ITAPUA', 'YATYTAY', 'Concejal/Titular'),
    ('11', '2', '5', '3907012', 'NANCY MARIVEL GAUTO VALLEJOS', 'ITAPUA', 'TOMAS ROMERO PEREIRA', 'Concejal/Titular'),
    ('12', '8', '5', '1515537', 'DEMETRIO GAONA RIOS', 'ITAPUA', 'TOMAS ROMERO PEREIRA', 'Concejal/Titular'),
    ('13', '3', '5', '4549898', 'LISZTH PAOLA CABRERA', 'ITAPUA', 'CARLOS ANTONIO LÒPEZ', 'Concejal/Titular'),
    ('14', '4', '5', '2944454', 'JORGE HERMINIO GIMENEZ AMARILLA', 'ITAPUA', 'GRAL. ARTIGAS', 'Concejal/Titular'),
    ('15', '5', '5', '4221822', 'DERLIS ALBERTO MARTINEZ GONZALEZ', 'ITAPUA', 'GRAL. ARTIGAS', 'Concejal/Titular'),
    ('16', '10', '5', '3431429', 'FLORIA INES MACIEL GARAY', 'ITAPUA', 'GRAL. ARTIGAS', 'Concejal/Titular'),
    ('17', '11', '5', '5089554', 'MARCIANO RIGOBERTO SILVERO', 'ITAPUA', 'GRAL. ARTIGAS', 'Concejal/Titular'),
    ('18', '4', '5', '3523705', 'AMELIO ADAN FERNANDEZ BENITEZ', 'ITAPUA', 'EDELIRA', 'Concejal/Titular'),
    ('19', '5', '5', '5391641', 'PEDRO ISMAEL FERREIRA VERDUN', 'ITAPUA', 'EDELIRA', 'Concejal/Titular'),
    ('20', '10', '5', '3913644', 'CLAUDIA LOPEZ DUNKE', 'ITAPUA', 'EDELIRA', 'Concejal/Titular'),
    ('21', '4', '5', '5732509', 'DIEGO NICOLAS GARCIA ARANDA', 'ITAPUA', 'SAN COSME Y DAMIAN', 'Concejal/Titular'),
    ('22', '8', '5', '1302629', 'ANA EVANGELISTA COLMAN DE GIULIANI', 'ITAPUA', 'SAN COSME Y DAMIAN', 'Concejal/Titular'),
    ('23', '2', '5', '3715884', 'ISIDRO VERA FIGUEREDO', 'MISIONES', 'AYOLAS', 'Concejal/Titular'),
    ('24', '12', '5', '5947809', 'ROSSANA BEATRIZ RAMIREZ ROA', 'MISIONES', 'AYOLAS', 'Concejal/Titular'),
    ('25', '3', '5', '2077544', 'RAMON GONZALEZ ORTIZ', 'ALTO PARANA', 'O`LEARY', 'Concejal/Titular'),
    ('26', '1', '5', '3752086', 'OVIDIO JAVIER LEGUIZAMON', 'ALTO PARANA', 'HERNANDARIAS', 'Concejal/Titular'),
    ('27', '3', '5', '4247076', 'MARCELINA DORA ORTIZ', 'ALTO PARANA', 'HERNANDARIAS', 'Concejal/Titular'),
    ('28', '5', '5', '2000288', 'WALTER TORRES RUIZ', 'ALTO PARANA', 'HERNANDARIAS', 'Concejal/Titular'),
    ('29', '7', '5', '2857896', 'CESAR ANTONIO BOGADO', 'ALTO PARANA', 'HERNANDARIAS', 'Concejal/Titular'),
    ('30', '9', '5', '1198343', 'PASCUAL VAZQUEZ GIMENEZ', 'ALTO PARANA', 'HERNANDARIAS', 'Concejal/Titular'),
    ('31', '11', '5', '4842938', 'GUSTAVO RODOLFO PINTO ESPINOLA', 'ALTO PARANA', 'HERNANDARIAS', 'Concejal/Titular'),
    ('32', '2', '5', '6190042', 'RODRIGO CLAUDEMIR CANDADO RUIZ', 'AMAMBAY', 'PEDRO JUAN CABALLERO', 'Concejal/Titular'),
    ('33', '12', '5', '6159903', 'SADY JUANA CENTURION ORTIZ', 'AMAMBAY', 'PEDRO JUAN CABALLERO', 'Concejal/Titular'),
    ('34', '3', '5', '2229856', 'EVER AGUSTIN VILLALBA GIMENEZ', 'CAAZAPA', 'CAAZAPA', 'Concejal/Titular'),
    ('35', '2', '5', '5560892', 'CARLOS MILCIADES GIMENEZ RECALDE', 'CAAZAPA', 'BUENA VISTA', 'Concejal/Titular'),
    ('36', '4', '5', '4235904', 'MARCOS MIGUEL DOLDAN VAZQUEZ', 'GUAIRA', 'INDEPENDENCIA', 'Concejal/Titular'),
    ('37', '3', '5', '4336754', 'LOURDES ROCIO CABAÑAS GIMENEZ', 'CORDILLERA', 'CAACUPE', 'Concejal/Titular'),
    ('38', '5', '5', '3477392', 'RICARDO ALBERTO MAIDANA GIMENEZ', 'CORDILLERA', 'CAACUPE', 'Concejal/Titular'),
    ('39', '6', '5', '4464365', 'ANIBAL SILVANI ASILVERA MARTINEZ', 'CORDILLERA', 'CAACUPE', 'Concejal/Titular'),
    ('40', '9', '5', '3675540', 'NESTOR RODRIGO RAMIREZ RAMIREZ', 'CORDILLERA', 'CAACUPE', 'Concejal/Titular'),
    ('41', '11', '5', '4175191', 'MARIA ELIZABETH NUÑEZ GONZALEZ', 'CORDILLERA', 'CAACUPE', 'Concejal/Titular'),
    ('42', '12', '5', '3229239', 'CYNTHIA BEATRIZ ROLON BRITOS', 'CORDILLERA', 'CAACUPE', 'Concejal/Titular'),
    ('43', '1', '5', '5015433', 'MARCIANO ROLANDO BARRIOS SANABRIA', 'SAN PEDRO', 'SANTA ROSA DEL AGUARAY', 'Concejal/Titular'),
    ('44', '5', '5', '7859313', 'LISANDRA BAREIRO CORONEL', 'SAN PEDRO', 'SANTA ROSA DEL AGUARAY', 'Concejal/Titular'),
    ('45', '7', '5', '1709399', 'GUILLERMINA ARCE', 'SAN PEDRO', 'SANTA ROSA DEL AGUARAY', 'Concejal/Titular'),
    ('46', '9', '5', '5275592', 'NORMA ELIZABETH PEREZ BOGADO', 'SAN PEDRO', 'SANTA ROSA DEL AGUARAY', 'Concejal/Titular'),
    ('47', '10', '5', '6009857', 'NISBALDO SALVADOR CASCO FRANCO', 'SAN PEDRO', 'SANTA ROSA DEL AGUARAY', 'Concejal/Titular'),
    ('48', '11', '5', '4651755', 'CAROLINA ZORRILLA ESPINOZA', 'SAN PEDRO', 'SANTA ROSA DEL AGUARAY', 'Concejal/Titular'),
    ('49', '7', '5', '3464564', 'RICHARD CRISTYAN MONTAÑEZ RIVAS', 'CANINDEYU', 'MARACANA', 'Concejal/Titular'),
    ('50', '4', '5', '2884034', 'DOMINGO RUIZ INSFRAN', 'CANINDEYU', 'JASY CAÑY', 'Concejal/Titular'),
    ('51', '4', '3', '1739908', 'NINFA VIVIANA GUIOTTO MARTINEZ', 'PTE. HAYES', 'VILLA HAYES', 'Concejal/Titular'),
    ('52', '5', '5', '2199959', 'RONALD JAVIER ROMAN PALACIOS', 'PTE. HAYES', 'BENJAMIN ACEVAL', 'Concejal/Titular'),
    ('53', '2', '5', '2180874', 'JULIO CESAR RIVEROS BARRETO', 'BOQUERON', 'BOQUERON', 'Concejal/Titular'),
    ('54', '6', '5', '5586712', 'YOLANDA YANED FERREIRA GUERRA', 'BOQUERON', 'BOQUERON', 'Concejal/Titular'),
    ('55', '10', '5', '5470795', 'BRIGIDO ORTIZ BENITEZ', 'BOQUERON', 'BOQUERON', 'Concejal/Titular'),
    ('56', '2', '7', '4510760', 'ANDREA MICAELA ROA DUARTE', 'BOQUERON', 'MARISCAL ESTIGARRIBIA', 'Concejal/Titular'),
    ('57', '6', '6', '5202939', 'DAIHANA BEATRIZ LOVERA MALDONADO', 'BOQUERON', 'MARISCAL ESTIGARRIBIA', 'Concejal/Titular'),
    ('58', '10', '7', '4799778', 'MISAEL GUSTAVO ORTIZ JACQUET', 'BOQUERON', 'MARISCAL ESTIGARRIBIA', 'Concejal/Titular'),
    ('59', '2', '5', '4151919', 'LUIS ALBERTO DA SILVA MERELES', 'ALTO PARAGUAY', 'BAHIA NEGRA', 'Concejal/Titular'),
    ('60', '4', '5', '7062492', 'ADRIANO MARTINEZ', 'ALTO PARAGUAY', 'BAHIA NEGRA', 'Concejal/Titular'),
    ('61', '6', '5', '4905802', 'RAMON ACOSTA MARECO', 'ALTO PARAGUAY', 'BAHIA NEGRA', 'Concejal/Titular'),
    ('62', '8', '5', '5599954', 'DOMINGO MATIAS BATE MENDOZA', 'ALTO PARAGUAY', 'BAHIA NEGRA', 'Concejal/Titular'),
    ('63', '10', '5', '3611603', 'NINFA HORTENCIA CASCO BENITEZ', 'ALTO PARAGUAY', 'BAHIA NEGRA', 'Concejal/Titular'),
    ('64', '4', '3', '1129293', 'GUSTAVO JAVIER RODRIGUEZ ESPINOLA', 'CAPITAL', 'ASUNCION', 'Concejal/Titular'),
    ('65', '16', '3', '4002173', 'LOURDES CORALIE ARBO ROJAS', 'CAPITAL', 'ASUNCION', 'Concejal/Titular'),
    ('66', '7', '5', '3506128', 'ALBA MARLENE PACHECO PESOA', 'CENTRAL', 'SAN LORENZO', 'Concejal/Titular'),
    ('67', '8', '5', '1003231', 'IVAN FERNANDO ALLENDE CRISCIONI', 'CENTRAL', 'SAN LORENZO', 'Concejal/Titular'),
    ('68', '6', '5', '3863219', 'MARIA CONCEPCION PICO OVIEDO', 'CENTRAL', 'FERNANDO DE LA MORA', 'Concejal/Titular'),
    ('69', '8', '5', '5116903', 'ELDA IRIS CARDOZO', 'CENTRAL', 'FERNANDO DE LA MORA', 'Concejal/Titular'),
    ('70', '12', '5', '928167', 'LUIS ALBERTO ONIEVA PAREDES', 'CENTRAL', 'FERNANDO DE LA MORA', 'Concejal/Titular'),
    ('71', '5', '5', '4626379', 'LUIS ADRIAN ULIAMBRE', 'CENTRAL', 'ÑEMBY', 'Concejal/Titular'),
    ('72', '4', '5', '3555111', 'EULOGIO JAVIER BOGADO BAEZ', 'CENTRAL', 'VILLA ELISA', 'Concejal/Titular'),
    ('73', '5', '5', '1162734', 'ZULMA BEATRIZ ROJAS', 'CENTRAL', 'ITA', 'Concejal/Titular'),
    ('74', '2', '5', '954806', 'GREGORIO PRIETO BARRIOS', 'CENTRAL', 'YPANE', 'Concejal/Titular'),
    ('75', '4', '5', '2493806', 'EDISON ALCIBIADES GAONA SALINAS', 'CENTRAL', 'YPANE', 'Concejal/Titular'),
    ('76', '6', '5', '3525631', 'BLANCA ELENA FRUTOS DE MOLINA', 'CENTRAL', 'YPANE', 'Concejal/Titular'),
    ('77', '1', '5', '4236896', 'KATIA ANTONELLA VILLALBA LATERRA', 'CENTRAL', 'LUQUE', 'Concejal/Titular'),
    ('78', '5', '5', '933780', 'MARIO JOSE ESQUIVEL BADO', 'CENTRAL', 'LUQUE', 'Concejal/Titular'),
    ('79', '12', '5', '4945979', 'ROCIO ANALY SERVIN FLEITAS', 'CENTRAL', 'LUQUE', 'Concejal/Titular'),
    ('80', '2', '5', '984337', 'STELLA MARY MIRANDA GARCIA', 'CENTRAL', 'LAMBARE', 'Concejal/Titular'),
    ('81', '11', '5', '737361', 'LILIA CONCEPCION BRITEZ BELLO', 'CENTRAL', 'LAMBARE', 'Concejal/Titular'),
    ('82', '2', '5', '3517744', 'FERNANDO SATURNINO MARTINEZ PERALTA', 'CENTRAL', 'CAPIATA', 'Concejal/Titular'),
    ('83', '4', '5', '1001012', 'RUMILDA ESTER INSFRAN DE MARTINEZ', 'CENTRAL', 'CAPIATA', 'Concejal/Titular'),
    ('84', '9', '5', '1471958', 'CELINA GONZALEZ', 'CENTRAL', 'CAPIATA', 'Concejal/Titular'),
    ('85', '4', '5', '4365222', 'ANA LIBRADA BENITEZ JARA', 'CENTRAL', 'AREGUA', 'Concejal/Titular'),
    ('86', '1', '5', '2257198', 'JOSE MARIA VERA', 'CONCEPCION', 'ARROYITO', 'Concejal/Titular'),
    ('87', '2', '5', '3366247', 'SIXTO AYALA BENITEZ', 'CONCEPCION', 'ARROYITO', 'Concejal/Titular'),
    ('88', '3', '5', '1210747', 'ALEJANDRO GONZALEZ NUÑEZ', 'CONCEPCION', 'ARROYITO', 'Concejal/Titular'),
    ('89', '4', '5', '5938144', 'CINYTHIA CHAPARRO DE GALEANO', 'CONCEPCION', 'ARROYITO', 'Concejal/Titular'),
    ('90', '5', '5', '3039393', 'HERMES DESIDERIO GONZALEZ CENTURION', 'CONCEPCION', 'ARROYITO', 'Concejal/Titular'),
    ('91', '6', '5', '1895296', 'MODESTO MONTIEL SILVA', 'CONCEPCION', 'ARROYITO', 'Concejal/Titular'),
    ('92', '7', '5', '4302209', 'HERIBERTO QUINTANA BURGO', 'CONCEPCION', 'ARROYITO', 'Concejal/Titular'),
    ('93', '8', '5', '1930857', 'LEONARDO DO SANTO PEÑA', 'CONCEPCION', 'ARROYITO', 'Concejal/Titular'),
    ('94', '9', '5', '6593568', 'OSCAR DAVID VILLAMAYOR ORTIZ', 'CONCEPCION', 'ARROYITO', 'Concejal/Titular'),
    ('95', '1', '5', '2143898', 'CANTIDO VINZ', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('96', '2', '5', '2182136', 'ELEUTERIO OCAMPOS CHAPINTO', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('97', '3', '5', '3034558', 'ABELARDO CABAÑA', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('98', '4', '5', '5746937', 'BONIFACIO PENNER GOMEZ', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('99', '5', '5', '4339374', 'JOSEFINA GONZALEZ DE MAYQUE', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('100', '6', '5', '2334958', 'ABEL GOMEZ', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('101', '7', '5', '4432581', 'NAZARIO BENTIEZ GARCIA', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('102', '8', '5', '4378979', 'TEOFILO MOLINA', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('103', '9', '5', '2324207', 'ADOLFO CARDOZO GEM', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('104', '10', '5', '4079396', 'VICTORIANO RUIZ AQUINO', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('105', '11', '5', '1691103', 'SILVERIO CENTURION SALINAS', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('106', '12', '5', '5185344', 'DARIO JARA ACUÑA', 'PTE. HAYES', 'TENIENTE IRALA FERNANDEZ', 'Concejal/Titular'),
    ('107', '1', '5', '2060302', 'EDGAR SILVERIO GOMEZ FERNANDEZ', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('108', '2', '5', '5444163', 'LEIDY GISSEL ARRUA VERON', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('109', '3', '5', '4654668', 'BLACIDO PATROCINIO GOSEN', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('110', '4', '5', '2938239', 'MARTIN GOMEZ MARTINEZ', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('111', '5', '5', '3008847', 'CARLOS ALBERTO DUARTE LOPEZ', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('112', '6', '5', '5106863', 'YANINA MABEL CORONEL VILLA', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('113', '7', '5', '4425538', 'MILER ANDERSON FERREIRA TORRES', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('114', '8', '5', '3023683', 'OSCAR VICENTE NUÑEZ CORONEL', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('115', '9', '5', '3753027', 'TEOFILO PORTILLO FLORENTIN', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('116', '10', '5', '6181400', 'HUGO JAVIER BENITEZ LEZCANO', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('117', '11', '5', '4822918', 'NELSON FELIPE TALAVERA OVELAR', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('118', '12', '5', '4118606', 'RODRIGO TEVEZ MORENO', 'BOQUERON', 'LOMA PLATA', 'Concejal/Titular'),
    ('119', '1', '5', '2088920', 'ANIBAL MAIDANA VERA', 'ITAPUA', 'SAN COSME Y DAMIAN', 'Intendente'),
    ('120', '1', '5', '4027700', 'EDGAR DANIEL BRITEZ ANDINO', 'ITAPUA', 'EDELIRA', 'Intendente')
),
normalized as (
  select distinct on (regexp_replace(cedula, '\D', '', 'g'))
    source_row,
    nullif(trim(numero_orden), '') as numero_orden,
    nullif(trim(numero_lista), '') as numero_lista,
    nullif(regexp_replace(cedula, '\D', '', 'g'), '') as cedula,
    trim(nombre_candidato) as nombre_candidato,
    nullif(trim(departamento_excel), '') as departamento_excel,
    nullif(trim(ciudad_excel), '') as ciudad_excel,
    nullif(trim(cargo), '') as cargo
  from incoming
  where nullif(regexp_replace(cedula, '\D', '', 'g'), '') is not null
  order by regexp_replace(cedula, '\D', '', 'g'), source_row
),
prepared as (
  select
    normalized.source_row,
    normalized.cedula,
    normalized.nombre_candidato,
    normalized.cargo,
    normalized.numero_lista,
    normalized.numero_orden,
    coalesce(nullif(trim(padron.departamento), ''), normalized.departamento_excel) as departamento,
    coalesce(nullif(trim(padron.distrito_descripcion), ''), normalized.ciudad_excel) as ciudad,
    padron.ogc_fid as padron_ogc_fid,
    case
      when padron.cedula is null then '{}'::jsonb
      else to_jsonb(padron)
    end as padron_snapshot,
    concat(
      'Importado desde candidatos2026.xlsx. Distrito planilla: ',
      coalesce(normalized.ciudad_excel, '-'),
      '. Fila Excel: ',
      normalized.source_row,
      '. Tipo no informado en planilla; se conserva el existente o se usa el default.'
    ) as observaciones
  from normalized
  left join lateral (
    select *
    from public.buscar_padron_por_cedula(normalized.cedula::numeric)
    limit 1
  ) as padron on true
),
updated as (
  update public.candidatos as candidato
  set
    cedula = prepared.cedula,
    nombre = prepared.nombre_candidato,
    nombre_candidato = prepared.nombre_candidato,
    cargo = prepared.cargo,
    numero_lista = prepared.numero_lista,
    numero_orden = prepared.numero_orden,
    departamento = prepared.departamento,
    ciudad = prepared.ciudad,
    padron_ogc_fid = prepared.padron_ogc_fid,
    padron_snapshot = prepared.padron_snapshot,
    observaciones = case
      when candidato.observaciones is null
        or trim(candidato.observaciones) = ''
        or candidato.observaciones ilike 'Importado desde %'
      then prepared.observaciones
      else candidato.observaciones
    end,
    updated_at = now()
  from prepared
  where
    candidato.cedula = prepared.cedula
    or (
      candidato.cedula is null
      and upper(trim(coalesce(candidato.nombre_candidato, candidato.nombre, ''))) = upper(trim(prepared.nombre_candidato))
      and trim(coalesce(candidato.numero_lista, '')) = coalesce(prepared.numero_lista, '')
    )
  returning candidato.id
)
insert into public.candidatos (
  nombre,
  nombre_candidato,
  cedula,
  cargo,
  numero_lista,
  numero_orden,
  departamento,
  ciudad,
  padron_ogc_fid,
  padron_snapshot,
  observaciones,
  activo,
  created_by_user
)
select
  prepared.nombre_candidato,
  prepared.nombre_candidato,
  prepared.cedula,
  prepared.cargo,
  prepared.numero_lista,
  prepared.numero_orden,
  prepared.departamento,
  prepared.ciudad,
  prepared.padron_ogc_fid,
  prepared.padron_snapshot,
  prepared.observaciones,
  true,
  'import candidatos 2026'
from prepared
where not exists (
  select 1
  from public.candidatos as candidato
  where
    candidato.cedula = prepared.cedula
    or (
      candidato.cedula is null
      and upper(trim(coalesce(candidato.nombre_candidato, candidato.nombre, ''))) = upper(trim(prepared.nombre_candidato))
      and trim(coalesce(candidato.numero_lista, '')) = coalesce(prepared.numero_lista, '')
    )
);

notify pgrst, 'reload schema';
