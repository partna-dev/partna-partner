<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  TooMany,
  Unauthorized,
  loadDashboard,
  type Dashboard,
} from "./api";
import { memberStatus, money, payoutStatus, when } from "./format";
import { keepToken, takeToken } from "./token";

const token = ref("");
const data = ref<Dashboard | null>(null);
const loading = ref(false);
const error = ref("");
const copied = ref("");
const linkCopied = ref(false);

const currency = computed(() => data.value?.currency ?? "RUB");
const minimum = computed(() => data.value?.payoutMinimumMinor ?? 0);
const shortOfMinimum = computed(() => {
  const summary = data.value?.summary;
  if (!summary || minimum.value <= 0) {
    return null;
  }
  if (summary.availableMinor >= minimum.value) {
    return null;
  }
  return money(minimum.value, currency.value);
});

const brandStyle = computed(() => {
  const brand = data.value?.brand;
  return {
    "--brand": brand?.color ?? "#4f46e5",
    "--brand-2": brand?.color2 ?? "#7c3aed",
  };
});

function statusText(value: string): string {
  return memberStatus(value);
}

async function load(): Promise<void> {
  token.value = token.value || takeToken();
  if (!token.value) {
    error.value = "none";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const payload = await loadDashboard(token.value);
    data.value = payload;
    keepToken(payload.access?.token ?? null);
    if (payload.access?.token) {
      token.value = payload.access.token;
    }
    document.title = `${payload.brand.name} — кабинет партнёра`;
  } catch (problem) {
    data.value = null;
    if (problem instanceof Unauthorized) {
      error.value = "expired";
    } else if (problem instanceof TooMany) {
      error.value = "too-many";
    } else {
      error.value = problem instanceof Error ? problem.message : "не удалось загрузить кабинет";
    }
  } finally {
    loading.value = false;
  }
}

async function copy(value: string, field: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    copied.value = field;
    window.setTimeout(() => {
      if (copied.value === field) {
        copied.value = "";
      }
    }, 2000);
  } catch {
    copied.value = "";
  }
}

async function copyClientLink(): Promise<void> {
  const link = data.value?.profile.referralUrl;
  if (!link) {
    return;
  }
  await copy(link, "client");
  linkCopied.value = copied.value === "client";
}

onMounted(load);
</script>

<template>
  <div class="page" :style="brandStyle">
    <main class="card">
      <p v-if="error === 'none'" class="empty">
        <strong>Ссылка не открыта.</strong>
        Кабинет открывается по личной ссылке от вашего специалиста: она содержит
        код доступа в конце адреса. Попросите ссылку заново.
      </p>

      <p v-else-if="error === 'expired'" class="empty">
        <strong>Ссылка недействительна или истекла.</strong>
        Попросите у специалиста новую — старая больше не откроется.
      </p>

      <p v-else-if="error === 'too-many'" class="empty">
        <strong>Слишком много запросов.</strong>
        Подождите минуту и обновите страницу.
      </p>

      <p v-else-if="error" class="empty">
        <strong>Не удалось загрузить кабинет.</strong>
        {{ error }}. Проверьте связь и обновите страницу.
      </p>

      <p v-else-if="loading && !data" class="empty">Загружаю…</p>

      <template v-else-if="data">
        <header class="head">
          <img
            v-if="data.brand.logo"
            class="logo"
            :src="data.brand.logo"
            :alt="data.brand.name"
          />
          <div v-else class="name">{{ data.brand.name }}</div>
          <p class="lead">Кабинет партнёра</p>
          <p class="muted small">
            Партнёр {{ data.profile.memberId }} · {{ statusText(data.profile.status) }}
          </p>
        </header>

        <section class="stats">
          <div class="stat">
            <span>Начислено</span>
            <strong>{{ money(data.summary.netEarnedMinor, currency) }}</strong>
          </div>
          <div class="stat">
            <span>Выплачено</span>
            <strong>{{ money(data.summary.paidMinor, currency) }}</strong>
          </div>
          <div class="stat accent">
            <span>Доступно к выплате</span>
            <strong>{{ money(data.summary.availableMinor, currency) }}</strong>
          </div>
          <div class="stat">
            <span>В ожидании</span>
            <strong>{{ money(data.summary.pendingPayoutMinor, currency) }}</strong>
          </div>
        </section>

        <p v-if="data.summary.heldMinor > 0" class="muted small">
          На удержании {{ money(data.summary.heldMinor, currency) }} — станет доступно
          позже.
        </p>
        <p v-if="shortOfMinimum" class="note">
          Выплата начнётся, когда доступно будет не меньше {{ shortOfMinimum }}.
        </p>

        <section class="block">
          <h2>Ссылка для клиентов</h2>
          <p class="muted small">
            Её открывают ваши клиенты, чтобы получить скидку. Переход запоминается на
            месяц.
          </p>
          <div v-if="data.profile.referralUrl" class="row link">
            <code>{{ data.profile.referralUrl }}</code>
            <button type="button" @click="copyClientLink">
              {{ linkCopied ? "Скопировано" : "Скопировать" }}
            </button>
          </div>
          <p v-else class="muted small">Ссылка пока не выдана — напишите специалисту.</p>
        </section>

        <section class="block">
          <h2>Приглашённые</h2>
          <p class="muted small">
            {{ data.summary.invitedCount }} всего · {{ data.summary.activeInvitedCount }}
            активных · заявок {{ data.summary.leadsTotal }}, оплачено
            {{ data.summary.leadsPaid }}
          </p>
          <div v-if="data.invited.length" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Код</th>
                  <th>Статус</th>
                  <th>Начислено</th>
                  <th>Когда</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in data.invited" :key="item.memberId">
                  <td>{{ item.externalId || item.memberId }}</td>
                  <td>{{ item.code }}</td>
                  <td>{{ statusText(item.status) }}</td>
                  <td>{{ money(item.accruedMinor, currency) }}</td>
                  <td>{{ when(item.claimedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="muted small">
            Пока никого нет. Поделитесь ссылкой — клиенты появятся здесь.
          </p>
        </section>

        <section class="block">
          <h2>Выплаты</h2>
          <div v-if="data.payouts.length" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Период</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in data.payouts" :key="item.itemId">
                  <td>{{ item.periodId }}</td>
                  <td>{{ money(item.amountMinor, item.currency) }}</td>
                  <td>{{ payoutStatus(item.status) }}</td>
                  <td>{{ when(item.paidAt ?? item.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="muted small">Выплат пока нет.</p>
        </section>

        <section v-if="data.specialists.length" class="block">
          <h2>Специалисты, которых вы привели</h2>
          <p class="muted small">
            Их подключили по вашей ссылке. Видно, опубликована ли страница и оплачено
            ли подключение.
          </p>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Специалист</th>
                  <th>Приведён</th>
                  <th>Страница</th>
                  <th>Подключение</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in data.specialists" :key="item.tenantId">
                  <td>
                    <a
                      v-if="item.domain"
                      :href="`https://${item.domain}`"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ item.name }}
                    </a>
                    <span v-else>{{ item.name }}</span>
                  </td>
                  <td>{{ when(item.createdAt) }}</td>
                  <td>{{ item.published ? "опубликована" : "черновик" }}</td>
                  <td>{{ item.paid ? "оплачено" : "не оплачено" }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <footer class="foot">
          <p class="muted small">{{ data.brand.support }}</p>
          <p v-if="data.access.expiresAt" class="muted small">
            Доступ продлевается сам; ссылка действует до
            {{ when(data.access.expiresAt) }}.
          </p>
          <p class="muted small">
            Деньги считает сервис специалиста: здесь видно, сколько начислено и
            выплачено.
          </p>
        </footer>
      </template>
    </main>
  </div>
</template>

<style>
:root {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  background: #f6f7fb;
  color: #14161f;
}

.page {
  --brand: #4f46e5;
  --brand-2: #7c3aed;
  min-height: 100vh;
  padding: 24px 16px 48px;
}

.card {
  max-width: 880px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e6e8f0;
  border-radius: 18px;
  padding: 24px;
}

.head {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  max-height: 48px;
}

.name {
  font-size: 22px;
  font-weight: 650;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.lead {
  margin: 6px 0 2px;
  font-size: 15px;
  color: #4b5060;
}

.muted {
  color: #6b7185;
}

.small {
  font-size: 13px;
  line-height: 1.5;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin: 20px 0 8px;
}

.stat {
  border: 1px solid #e6e8f0;
  border-radius: 14px;
  padding: 14px;
}

.stat span {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7185;
  margin-bottom: 6px;
}

.stat strong {
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}

.stat.accent {
  border-color: transparent;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
}

.stat.accent span,
.stat.accent strong {
  color: #fff;
}

.note {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
}

.block {
  margin-top: 28px;
}

h2 {
  font-size: 17px;
  margin: 0 0 6px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.link code {
  flex: 1 1 260px;
  overflow-wrap: anywhere;
  background: #f3f4f8;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
}

button {
  font: inherit;
  cursor: pointer;
  border-radius: 10px;
  border: 1px solid #e6e8f0;
  padding: 9px 14px;
  background: #fff;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e6e8f0;
  border-radius: 14px;
  margin-top: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #eef0f6;
  white-space: nowrap;
}

th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7185;
  background: #fafbfe;
}

tbody tr:last-child td {
  border-bottom: none;
}

a {
  color: var(--brand);
}

.empty {
  margin: 8px 0;
  font-size: 15px;
  line-height: 1.6;
}

.foot {
  margin-top: 28px;
  border-top: 1px solid #eef0f6;
  padding-top: 16px;
}

.foot p {
  margin: 6px 0;
}

@media (max-width: 600px) {
  .page {
    padding: 12px 10px 32px;
  }

  .card {
    padding: 16px;
    border-radius: 14px;
  }
}
</style>
