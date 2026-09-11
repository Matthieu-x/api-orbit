// utils/plans.js
// Fuente unica de verdad para los 5 planes de Orbit API.
// tierRank se usa para comparar acceso: un plan con tierRank mayor
// siempre incluye el acceso de los planes por debajo de el.

const PLANS = {
  free: {
    key: "free",
    label: "Free",
    requestsLimit: 100,
    price: 0,
    tierRank: 0,
    description: "El plan normal de cualquier cuenta nueva."
  },
  basic: {
    key: "basic",
    label: "Basic",
    requestsLimit: 300,
    price: 1,
    tierRank: 1,
    description: "Más solicitudes al día. Sin acceso a los endpoints premium."
  },
  plus: {
    key: "plus",
    label: "Plus",
    requestsLimit: 1000,
    price: 3,
    tierRank: 2,
    description: "Acceso a Anime y descarga de YouTube Video."
  },
  vip: {
    key: "vip",
    label: "VIP",
    requestsLimit: 2000,
    price: 5,
    tierRank: 3,
    description: "Acceso a todos los endpoints premium: IA, Anime, YouTube Video, Aptoide y F-Droid."
  },
  superorbit: {
    key: "superorbit",
    label: "SuperOrbit",
    requestsLimit: 5000,
    price: 10,
    tierRank: 4,
    description: "Acceso a todos los endpoints, mayor prioridad en las solicitudes y soporte prioritario."
  }
};

const PLAN_ORDER = ["free", "basic", "plus", "vip", "superorbit"];

function planConfig(key) {
  return PLANS[key] || PLANS.free;
}

function planRank(key) {
  return planConfig(key).tierRank;
}

// El plan "efectivo" de un usuario: admins siempre tienen el maximo.
function planOf(user) {
  if (Number(user.is_admin) === 1) return "superorbit";
  return PLANS[user.plan] ? user.plan : "free";
}

function userPlanRank(user) {
  return planRank(planOf(user));
}

// true si el plan actual del usuario alcanza el tier minimo requerido
// (ej. hasMinPlan(user, "plus") es true para plus, vip y superorbit).
function hasMinPlan(user, minPlanKey) {
  return userPlanRank(user) >= planRank(minPlanKey);
}

module.exports = { PLANS, PLAN_ORDER, planConfig, planRank, planOf, userPlanRank, hasMinPlan };
