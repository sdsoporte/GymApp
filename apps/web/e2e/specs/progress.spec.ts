import { expect, test } from '../test.js';
import { labels, testIds } from '../selectors.js';

const EXERCISE_QUERY = 'barbell curl';
const EXERCISE_NAME_PATTERN = /barbell curl/i;
const LOGGED_SET_PATTERN = /Serie 1: 50[,.]?\d*kg × 8.*RPE 8[,.]?\d*/i;
const WEIGHT_MAX_PATTERN = /Máximo 50[,.]?\d*kg/i;
const WEIGHT_LATEST_PATTERN = /Último valor 50[,.]?\d*kg/i;

async function createRoutineWithExercise(
  page: Parameters<Parameters<typeof test>[2]>[0]['page'],
  name: string
) {
  await page.goto('/routines/new');
  await expect(page.getByRole('heading', { name: /Nueva rutina/i })).toBeVisible();

  await page.getByPlaceholder(labels.newRoutineNamePlaceholder).fill(name);

  await page.getByRole('button', { name: labels.addExercise }).first().click();
  await expect(page.getByRole('heading', { name: labels.addExerciseHeading })).toBeVisible();

  await page.getByPlaceholder(labels.searchPlaceholder).fill(EXERCISE_QUERY);

  const result = page.getByTestId(testIds.exercisePickerResult).filter({ hasText: EXERCISE_NAME_PATTERN }).first();
  await expect(result).toBeVisible();

  await result.getByRole('button', { name: /Agregar .* a la rutina/i }).click();

  await expect(page.getByRole('heading', { name: labels.addExerciseHeading })).toBeHidden();
  await page.getByRole('button', { name: labels.saveRoutine }).click();

  await expect(page.getByRole('heading', { name: labels.routinesHeading })).toBeVisible();
  const card = page.getByTestId(testIds.routineCard).filter({ hasText: name }).first();
  await expect(card).toBeVisible();

  return card;
}

async function completeWorkout(
  page: Parameters<Parameters<typeof test>[2]>[0]['page']
) {
  const name = 'Rutina de progreso E2E';
  const card = await createRoutineWithExercise(page, name);

  await card.getByRole('button', { name: /Iniciar sesión con/i }).click();
  await expect(page.getByRole('heading', { name: /Sesión activa/i })).toBeVisible();

  const exerciseCard = page.getByTestId(testIds.sessionExercise).filter({ hasText: EXERCISE_NAME_PATTERN }).first();
  await expect(exerciseCard).toBeVisible();

  await exerciseCard.getByLabel(labels.weightInputLabel).fill('50');
  await exerciseCard.getByLabel(labels.repsInputLabel).fill('8');
  await exerciseCard.getByLabel(labels.rpeInputLabel).fill('8');
  await exerciseCard.getByRole('button', { name: /Registrar serie 1/i }).click();

  await expect(exerciseCard.getByText(LOGGED_SET_PATTERN)).toBeVisible();
  await page.getByRole('button', { name: /Finalizar/i }).click();
  await expect(page.getByRole('heading', { name: /Sesión completada/i })).toBeVisible();
}

test.describe('progress and body metrics', () => {
  test('shows exercise weight chart after completing a workout and records a body metric', async ({ page }) => {
    await completeWorkout(page);

    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: labels.progressHeading })).toBeVisible();

    const select = page.getByRole('combobox');
    await expect(select).toBeVisible();
    const option = select.locator('option', { hasText: 'barbell curl' });
    await expect(option).toBeAttached();
    await select.selectOption({ label: 'barbell curl' });

    const chart = page.getByTestId(testIds.progressWeightChart);
    await expect(chart).toBeVisible();
    await expect(chart.getByText(/Mejor peso por sesión/i)).toBeVisible();
    await expect(chart.getByText(WEIGHT_MAX_PATTERN)).toBeVisible();
    await expect(chart.getByText(WEIGHT_LATEST_PATTERN)).toBeVisible();
    await expect(page.getByText(/50[,.]?\d*kg/i).first()).toBeVisible();

    await expect(page.getByRole('heading', { name: labels.bodyMetricsHeading })).toBeVisible();
    await page.getByRole('button', { name: labels.newBodyMetric }).click();

    await page.getByLabel(labels.bodyMetricDateLabel).fill('2026-08-22T08:00');
    await page.getByLabel(labels.bodyMetricWeightLabel).fill('75.5');
    await page.getByLabel(labels.bodyMetricFatLabel).fill('18');
    await page.getByLabel(labels.bodyMetricWaistLabel).fill('85');
    await page.getByRole('button', { name: labels.saveBodyMetric }).click();

    const row = page.getByTestId(testIds.bodyMetricRow).first();
    await expect(row).toBeVisible();
    await expect(row.getByText(/75[,.]?\d*kg/i)).toBeVisible();
    await expect(row.getByText(/18[,.]?\d*%/i)).toBeVisible();
    await expect(row.getByText(/85[,.]?\d*cm/i)).toBeVisible();
  });
});
