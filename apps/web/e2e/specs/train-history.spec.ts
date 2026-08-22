import { expect, test } from '../test.js';
import { labels, testIds } from '../selectors.js';

const EXERCISE_QUERY = 'barbell curl';
const EXERCISE_NAME_PATTERN = /barbell curl/i;
const LOGGED_SET_PATTERN = /Serie 1: 50[,.]?\d*kg × 8.*RPE 8[,.]?\d*/i;

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

test.describe('train and history', () => {
  test('starts a routine, logs a set with RPE, completes the session, and verifies history', async ({ page }) => {
    const name = 'Rutina de entrenamiento E2E';
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
    await expect(page.getByText('Descanso').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Pausar descanso/i })).toBeVisible();

    await page.getByRole('button', { name: /Finalizar/i }).click();
    await expect(page.getByRole('heading', { name: /Sesión completada/i })).toBeVisible();
    await expect(page.getByText(/1 series registradas/i)).toBeVisible();
    await expect(page.getByText(EXERCISE_NAME_PATTERN).first()).toBeVisible();
    await expect(page.getByText(LOGGED_SET_PATTERN)).toBeVisible();

    await page.goto('/history');
    await expect(page.getByRole('heading', { name: labels.historyHeading })).toBeVisible();

    const historyRow = page.getByTestId(testIds.historySessionRow).first();
    await expect(historyRow).toBeVisible();
    await expect(historyRow.getByText(/1 series/i)).toBeVisible();

    await historyRow.click();
    await expect(page.getByRole('heading', { name: /Sesión del/i })).toBeVisible();
    await expect(page.getByText(EXERCISE_NAME_PATTERN).first()).toBeVisible();
    await expect(page.getByText(LOGGED_SET_PATTERN)).toBeVisible();
  });
});
