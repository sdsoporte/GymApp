import { expect, test } from '../test.js';
import { labels, testIds } from '../selectors.js';

const EXERCISE_QUERY = 'barbell curl';
const EXERCISE_NAME_PATTERN = /barbell curl/i;

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
  await expect(page.getByPlaceholder(labels.newRoutineNamePlaceholder)).toHaveValue(name);
  await expect(page.getByText(EXERCISE_NAME_PATTERN).first()).toBeVisible();

  await page.getByRole('button', { name: labels.saveRoutine }).click();

  await expect(page.getByRole('heading', { name: labels.routinesHeading })).toBeVisible();
  const card = page.getByTestId(testIds.routineCard).filter({ hasText: name }).first();
  await expect(card).toBeVisible();
  await expect(card.getByText(/1 ejercicio/i)).toBeVisible();

  return card;
}

test.describe('routines', () => {
  test('creates a routine, adds exercise via explicit Agregar, and shows it in the list without refresh', async ({ page }) => {
    const name = 'Rutina de prueba E2E';
    await createRoutineWithExercise(page, name);
  });

  test('updates a routine name and preserves exercise count', async ({ page }) => {
    const originalName = 'Rutina original';
    await createRoutineWithExercise(page, originalName);

    const card = page.getByTestId(testIds.routineCard).filter({ hasText: originalName }).first();
    await card.click();

    await expect(page.getByRole('heading', { name: /Editar rutina/i })).toBeVisible();

    const newName = 'Rutina renombrada';
    await page.getByPlaceholder(labels.newRoutineNamePlaceholder).fill(newName);
    await page.getByRole('button', { name: labels.saveRoutine }).click();

    await expect(page.getByRole('heading', { name: labels.routinesHeading })).toBeVisible();
    const updatedCard = page.getByTestId(testIds.routineCard).filter({ hasText: newName }).first();
    await expect(updatedCard).toBeVisible();
    await expect(updatedCard.getByText(/1 ejercicio/i)).toBeVisible();
    await expect(page.getByTestId(testIds.routineCard).filter({ hasText: originalName })).toHaveCount(0);
  });

  test('deletes a routine from the edit page', async ({ page }) => {
    const name = 'Rutina para eliminar';
    await createRoutineWithExercise(page, name);

    const card = page.getByTestId(testIds.routineCard).filter({ hasText: name }).first();
    await card.click();

    await expect(page.getByRole('heading', { name: /Editar rutina/i })).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Eliminar rutina' }).click();

    await expect(page.getByRole('heading', { name: labels.routinesHeading })).toBeVisible();
    await expect(page.getByTestId(testIds.routineCard).filter({ hasText: name })).toHaveCount(0);
  });
});
