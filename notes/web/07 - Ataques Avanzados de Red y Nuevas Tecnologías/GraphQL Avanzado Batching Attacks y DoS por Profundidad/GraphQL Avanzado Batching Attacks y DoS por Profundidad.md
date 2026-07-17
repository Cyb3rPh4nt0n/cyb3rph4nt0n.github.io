
-- -
# 1. GraphQL Batching Attack (Ataque de Lotes / Evasión de Rate Limit)

Muchas APIs de GraphQL permiten el _Query Batching_, es decir, enviar múltiples consultas independientes empaquetadas dentro de un único array JSON en una sola petición HTTP.

Si una aplicación restringe el inicio de sesión a un máximo de 5 intentos por minuto (Rate Limiting), el filtro suele contar el número de peticiones HTTP que llegan al endpoint `/graphql`.

- **El Ataque:** El auditor envía una **única petición HTTP POST**, pero en el cuerpo mete un lote con 1000 intentos de inicio de sesión diferentes:

```JSON
[
{ "query": "mutation" { login(user:\"admin\", pass:\"123\") { token } }" },
{ "query": "mutation" { login(user:\"admin\", pass:\"456\") { token } }" }
]
```

- El firewall de la aplicación ve llegar una sola petición web y la deja pasar. Sin embargo, el motor interno de GraphQL procesará las 1000 operaciones de forma secuencial en la base de datos, permitiendo realizar fuerza bruta masiva saltándose los controles de tasa.
# 2. DoS por Profundidad de Consultas (Defensive Depth DoS)

En GraphQL, puedes definir relaciones circulares u objetos anidados (ej: un _Usuario_ tiene _Amigos_, y cada _Amigo_ es un _Usuario_ que a su vez tiene _Amigos_). Si el desarrollador no limita la **profundidad máxima de las consultas**, un auditor puede tumbar el servidor enviando una query recursiva geométrica:

```GraphQL
query {
	usuario(id: 1) {
		amigos {
			amigos{
				amigos{
					amigos{
						nombre # ·sto obliga al servidor a realizar millones de uniones (joins) en memoria
					}
				}
			}
		}
	}
}
```

El servidor web consumirá el 100% de la CPU e hilos de la base de datos intentando resolver este árbol infinito de relaciones, provocando una denegación de servicio inmediata para todos los usuarios legítimos de la plataforma.
# 3. Mitigación

Deshabilitar el procesamiento por lotes (_Batching_) si no es indispensable, implementar librerías de limitación de coste o profundidad de consultas (como _GraphQL Depth Limit_) para rechazar de inmediato cualquier petición que supere una estructura de 3 o 4 niveles de anidación, y aplicar controles de tasa (Rate Limiting) analizando las operaciones internas de la consulta, no solo las peticiones HTTP externas.
-- -
