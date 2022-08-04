/*
# Copyright 2022 OpenC3, Inc.
# All Rights Reserved.
#
# This program is free software; you can modify and/or redistribute it
# under the terms of the GNU Affero General Public License
# as published by the Free Software Foundation; version 3 with
# attribution addendums as found in the LICENSE.txt
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
*/

// @ts-check
import { test, expect } from 'playwright-test-coverage'
import { Utilities } from '../../utilities'
import * as fs from 'fs'

let utils
test.beforeEach(async ({ page }) => {
  utils = new Utilities(page)
  await page.goto('/tools/admin/plugins')
  await expect(page.locator('.v-app-bar')).toContainText('Administrator')
  await page.locator('.v-app-bar__nav-icon').click()
})

test('shows and hides built-in tools', async ({ page }) => {
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-demo')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-admin')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-autonomic')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-base')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-calendar')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-cmdsender')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-cmdtlmserver')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-dataextractor')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-dataviewer')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-handbooks')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-limitsmonitor')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-packetviewer')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-scriptrunner')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-tablemanager')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-tlmgrapher')
  await expect(page.locator('id=openc3-tool')).not.toContainText('openc3-tool-tlmviewer')

  await page.locator('text=Show Default Tools').click()
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-demo')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-admin')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-autonomic')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-base')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-calendar')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-cmdsender')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-cmdtlmserver')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-dataextractor')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-dataviewer')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-handbooks')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-limitsmonitor')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-packetviewer')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-scriptrunner')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-tablemanager')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-tlmgrapher')
  await expect(page.locator('id=openc3-tool')).toContainText('openc3-tool-tlmviewer')
})

test('shows targets associated with plugins', async ({ page }) => {
  // Check that the openc3-demo contains the following targets:
  await expect(
    page.locator('[data-test=plugin-list] div[role=listitem]:has-text("openc3-demo")')
  ).toContainText('EXAMPLE')
  await expect(
    page.locator('[data-test=plugin-list] div[role=listitem]:has-text("openc3-demo")')
  ).toContainText('INST')
  await expect(
    page.locator('[data-test=plugin-list] div[role=listitem]:has-text("openc3-demo")')
  ).toContainText('INST2')
  await expect(
    page.locator('[data-test=plugin-list] div[role=listitem]:has-text("openc3-demo")')
  ).toContainText('SYSTEM')
  await expect(
    page.locator('[data-test=plugin-list] div[role=listitem]:has-text("openc3-demo")')
  ).toContainText('TEMPLATED')
})

// NOTE: The following tests must be run in order as they install, modify, edit and delete a plugin

// This is generated by the playwright github workflow via .github/workflows/playwright.yml
// Follow the steps there to generate a local copy for test
let plugin = 'openc3-pw-test'
let pluginGem = 'openc3-pw-test-1.0.0.gem'
let pluginGem1 = 'openc3-pw-test-1.0.1.gem'

test('installs a new plugin', async ({ page }) => {
  // Note that Promise.all prevents a race condition
  // between clicking and waiting for the file chooser.
  const [fileChooser] = await Promise.all([
    // It is important to call waitForEvent before click to set up waiting.
    page.waitForEvent('filechooser'),
    // Opens the file chooser.
    await page.locator('text=Click to select').click({ force: true }),
  ])
  await fileChooser.setFiles(`../${plugin}/${pluginGem}`)
  await expect(page.locator('.v-dialog:has-text("Variables")')).toBeVisible()
  await page.locator('data-test=edit-submit').click()
  await expect(page.locator('[data-test=plugin-alert]')).toContainText('Started installing')
  // Plugin install can go so fast we can't count on 'Running' to be present so try catch this
  let regexp = new RegExp(`Processing plugin_install: ${pluginGem}__.* - Running`)
  try {
    await expect(page.locator('[data-test=process-list]')).toContainText(regexp, {
      timeout: 30000,
    })
  } catch {}
  // Ensure no Running are left
  await expect(page.locator('[data-test=process-list]')).not.toContainText(regexp, {
    timeout: 30000,
  })
  // Check for Complete
  regexp = new RegExp(`Processing plugin_install: ${pluginGem} - Complete`)
  await expect(page.locator('[data-test=process-list]')).toContainText(regexp)

  await expect(
    page.locator(`[data-test=plugin-list] div[role=listitem]:has-text("${plugin}")`)
  ).toContainText('PW_TEST')
  // Show the process output
  await page
    .locator(
      `[data-test=process-list] div[role=listitem]:has-text("${plugin}") >> [data-test=show-output]`
    )
    .first()
    .click()
  await expect(page.locator('.v-dialog--active')).toContainText('Process Output')
  await expect(page.locator('.v-dialog--active')).toContainText(`Loading new plugin: ${pluginGem}`)
  await page.locator('.v-dialog--active >> button:has-text("Ok")').click()
})

test('modifies plugin files', async ({ page }) => {
  // Check that there are no links (a) under the current plugin (no modified files)
  await expect(
    await page
      .locator(`[data-test=plugin-list] div[role=listitem]:has-text("${plugin}") >> a`)
      .count()
  ).toEqual(0)

  // Create a new script
  await page.goto('/tools/scriptrunner')
  await expect(page.locator('.v-app-bar')).toContainText('Script Runner')
  await page.locator('.v-app-bar__nav-icon').click()
  await page.locator('button:has-text("Close")').click()
  await page.locator('textarea').fill('puts "modify the PW_TEST"')
  await page.locator('[data-test=script-runner-file]').click()
  await page.locator('text=Save File').click()
  await page.locator('text=File Save As')
  await page.locator('.v-treeview-node:has-text("PW_TEST") >> button').click()
  await page.locator('text=procedures').click()
  await page.locator('[data-test=file-open-save-filename]').click()
  await page.type('[data-test=file-open-save-filename]', '/save_new.rb')
  await page.locator('[data-test=file-open-save-submit-btn]').click()
  await expect(page.locator('#sr-controls')).toContainText('PW_TEST/procedures/save_new.rb')

  // Create a new screen
  await page.goto('/tools/tlmviewer')
  await expect(page.locator('.v-app-bar')).toContainText('Telemetry Viewer')
  await page.locator('.v-app-bar__nav-icon').click()
  await page.locator('div[role="button"]:has-text("Select Target")').click()
  await page.locator(`.v-list-item__title:text-is("PW_TEST")`).click()
  await utils.sleep(500)
  await page.locator('button:has-text("New Screen")').click()
  await expect(page.locator(`.v-system-bar:has-text("New Screen")`)).toBeVisible()
  await page.locator('[data-test=new-screen-name]').fill('NEW_SCREEN')
  await page.locator('button:has-text("Ok")').click()
  await expect(page.locator(`.v-system-bar:has-text("PW_TEST NEW_SCREEN")`)).toBeVisible()

  // Download the changes
  await page.goto('/tools/admin/plugins')
  await expect(page.locator('.v-app-bar')).toContainText('Administrator')
  await page.locator('.v-app-bar__nav-icon').click()

  // Check that we have a link to click
  await expect(
    await page
      .locator(`[data-test=plugin-list] div[role=listitem]:has-text("${plugin}") >> a`)
      .count()
  ).toEqual(1)

  const [download] = await Promise.all([
    // Start waiting for the download
    page.waitForEvent('download'),
    // Download the modified plugin
    page.locator(`[data-test=plugin-list] div[role=listitem]:has-text("${plugin}") >> a`).click(),
  ])
  // Wait for the download process to complete
  const JSZip = require('jszip')
  const path = await download.path()
  fs.readFile(path, function (err, data) {
    if (err) throw err
    JSZip.loadAsync(data).then(function (zip) {
      Object.keys(zip.files).forEach(function (filename) {
        zip.files[filename].async('string').then(function (fileData) {
          // Check the zip file contents
          // We should have the new script:
          if (filename.includes('save_new.rb')) {
            expect(fileData).toBe('puts "modify the PW_TEST"')
          }
          // We should have the new screen:
          if (filename.includes('new_screen.txt')) {
            expect(fileData).toContain('SCREEN')
          }
        })
      })
    })
  })
})

test('upgrades existing plugin', async ({ page }) => {
  // Note that Promise.all prevents a race condition
  // between clicking and waiting for the file chooser.
  const [fileChooser] = await Promise.all([
    // It is important to call waitForEvent before click to set up waiting.
    page.waitForEvent('filechooser'),
    // Opens the file chooser.
    await page
      .locator(
        `[data-test=plugin-list] div[role=listitem]:has-text("${plugin}") >> [data-test=upgrade-plugin]`
      )
      .click(),
  ])
  await fileChooser.setFiles(`../${plugin}/${pluginGem1}`)
  await expect(page.locator('.v-dialog:has-text("Variables")')).toBeVisible()
  await page.locator('data-test=edit-submit').click()
  await expect(page.locator('.v-dialog:has-text("Modified")')).toBeVisible()
  // Check the delete box
  await page.locator('text=DELETE MODIFIED').click()
  await page.locator('data-test=modified-plugin-submit').click()
  await expect(page.locator('[data-test=plugin-alert]')).toContainText('Started installing')
  // Plugin install can go so fast we can't count on 'Running' to be present so try catch this
  let regexp = new RegExp(`Processing plugin_install: ${pluginGem}__.* - Running`)
  try {
    await expect(page.locator('[data-test=process-list]')).toContainText(regexp, {
      timeout: 30000,
    })
  } catch {}
  // Ensure no Running are left
  await expect(page.locator('[data-test=process-list]')).not.toContainText(regexp, {
    timeout: 30000,
  })
  // Check for Complete
  regexp = new RegExp(`Processing plugin_install: ${pluginGem1} - Complete`)
  await expect(page.locator('[data-test=process-list]')).toContainText(regexp)

  // Check that there are no longer any links (modified targets)
  await expect(
    await page
      .locator(`[data-test=plugin-list] div[role=listitem]:has-text("${plugin}") >> a`)
      .count()
  ).toEqual(0)
})

test('edits existing plugin', async ({ page }) => {
  // Edit then cancel
  await page
    .locator(
      `[data-test=plugin-list] div[role=listitem]:has-text("${plugin}") >> [data-test=edit-plugin]`
    )
    .click()
  await expect(page.locator('.v-dialog:has-text("Variables")')).toBeVisible()
  await page.locator('data-test=edit-cancel').click()
  await expect(page.locator('.v-dialog:has-text("Variables")')).not.toBeVisible()
  // Edit and change a target name (forces re-install)
  await page
    .locator(
      `[data-test=plugin-list] div[role=listitem]:has-text("${plugin}") >> [data-test=edit-plugin]`
    )
    .click()
  await expect(page.locator('.v-dialog:has-text("Variables")')).toBeVisible()
  await page
    .locator('.v-dialog:has-text("Variables") .v-input:has-text("pw_test_target_name") >> input')
    .fill('NEW_TGT')
  await page.locator('data-test=edit-submit').click()
  await expect(page.locator('[data-test=plugin-alert]')).toContainText('Started installing')
  // Plugin install can go so fast we can't count on 'Running' to be present so try catch this
  let regexp = new RegExp(`Processing plugin_install: ${pluginGem}__.* - Running`)
  try {
    await expect(page.locator('[data-test=process-list]')).toContainText(regexp, {
      timeout: 30000,
    })
  } catch {}
  // Ensure no Running are left
  await expect(page.locator('[data-test=process-list]')).not.toContainText(regexp, {
    timeout: 30000,
  })
  // Check for Complete ... note new installs append '__<TIMESTAMP>'
  regexp = new RegExp(`Processing plugin_install: ${pluginGem1}__.* - Complete`)
  await expect(page.locator('[data-test=process-list]')).toContainText(regexp)
  // Ensure the target list is updated to show the new name
  await expect(
    page.locator(`[data-test=plugin-list] div[role=listitem]:has-text("${plugin}")`)
  ).not.toContainText('PW_TEST')
  await expect(
    page.locator(`[data-test=plugin-list] div[role=listitem]:has-text("${plugin}")`)
  ).toContainText('NEW_TGT')
  // Show the process output
  await page
    .locator(
      `[data-test=process-list] div[role=listitem]:has-text("${plugin}") >> [data-test=show-output]`
    )
    .first()
    .click()
  await expect(page.locator('.v-dialog--active')).toContainText('Process Output')
  // TODO: Should this be Loading new or Updating existing?
  // await expect(page.locator('.v-dialog--active')).toContainText('Updating existing plugin')
  await page.locator('.v-dialog--active >> button:has-text("Ok")').click()
})

test('deletes a plugin', async ({ page }) => {
  await page
    .locator(
      `[data-test=plugin-list] div[role=listitem]:has-text("${plugin}") >> [data-test=delete-plugin]`
    )
    .click()
  await expect(page.locator('.v-dialog--active')).toContainText('Confirm')
  await page.locator('[data-test=confirm-dialog-delete]').click()
  await expect(page.locator('[data-test=plugin-alert]')).toContainText('Removing plugin')
  // Plugin install can go so fast we can't count on 'Running' to be present so try catch this
  let regexp = new RegExp(`Processing plugin_install: ${pluginGem}__.* - Running`)
  try {
    await expect(page.locator('[data-test=process-list]')).toContainText(regexp, {
      timeout: 30000,
    })
  } catch {}
  // Ensure no Running are left
  await expect(page.locator('[data-test=process-list]')).not.toContainText(regexp, {
    timeout: 30000,
  })
  // Check for Complete ... note new installs append '__<TIMESTAMP>'
  regexp = new RegExp(`Processing plugin_uninstall: ${pluginGem1}__.* - Complete`)
  await expect(page.locator('[data-test=process-list]')).toContainText(regexp)
  await expect(page.locator(`[data-test=plugin-list]`)).not.toContainText(plugin)
  // Show the process output
  await page
    .locator(
      `[data-test=process-list] div[role=listitem]:has-text("plugin_uninstall") >> [data-test=show-output]`
    )
    .first()
    .click()
  await expect(page.locator('.v-dialog--active')).toContainText('Process Output')
  await expect(page.locator('.v-dialog--active')).toContainText('PluginModel destroyed')
  await page.locator('.v-dialog--active >> button:has-text("Ok")').click()
})