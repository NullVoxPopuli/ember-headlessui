//NOTE: The @headlessui Vue test suite is the canonical representation of how this component should behave.
//      We should endevour to have a similar test suite to it:
//      https://github.com/tailwindlabs/headlessui/blob/412cc950aa7545c1d78ac0791ae136fa9c15294a/packages/%40headlessui-vue/src/components/menu/menu.test.tsx

import Component from '@glimmer/component';
import {
  click,
  find,
  findAll,
  render,
  triggerEvent,
  triggerKeyEvent,
} from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import QUnit, { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import { Keys } from 'ember-headlessui/utils/keyboard';

import { assertActiveElement } from '../../accessibility-assertions';

function getMenu() {
  return find('[role="menu"]');
}

function getMenuButton() {
  return find('button,[role="button"],[data-test-menu-button]');
}

function getMenuItems() {
  return Array.from(findAll('[role="menuitem"]'));
}

function assertClosedMenuButton(selector) {
  QUnit.assert.dom(selector).hasAttribute('id');
  QUnit.assert.dom(selector).hasAttribute('aria-haspopup');
  QUnit.assert.dom(selector).doesNotHaveAttribute('aria-controls');
  QUnit.assert.dom(selector).doesNotHaveAttribute('aria-expanded');
}

function assertOpenMenuButton(selector) {
  QUnit.assert.dom(selector).hasAttribute('id');
  QUnit.assert.dom(selector).hasAttribute('aria-haspopup');
  QUnit.assert.dom(selector).hasAttribute('aria-controls');
  QUnit.assert.dom(selector).hasAttribute('aria-expanded');
}

function assertMenuButtonLinkedWithMenuItems(
  menuButtonSelector,
  menuItemsSelector
) {
  let menuButtonElement = find(menuButtonSelector);
  let menuItemsElement = find(menuItemsSelector);

  QUnit.assert.dom(menuButtonElement).hasAria('controls', menuItemsElement.id);

  QUnit.assert
    .dom(menuItemsElement)
    .hasAria('labelledby', menuButtonElement.id);
}

function assertMenuLinkedWithMenuItem(item, menu = getMenu()) {
  const itemElement = find(item);

  // Ensure link between menu & menu item is correct
  QUnit.assert
    .dom(menu)
    .hasAria('activedescendant', itemElement.getAttribute('id'));
}

function assertMenuItemsAreCollapsed(selector) {
  QUnit.assert.dom(selector).isNotVisible();
}

function assertNoActiveMenuItem(menuSelector = getMenu()) {
  QUnit.assert.dom(menuSelector).doesNotHaveAria('activedescendant');
}

async function type(selector, value) {
  let finalKeyEventProcessing;

  for (const char of value) {
    finalKeyEventProcessing = triggerKeyEvent(
      selector,
      'keydown',
      char.toUpperCase()
    );
  }

  await finalKeyEventProcessing;
}

module('Integration | Component | <Menu>', (hooks) => {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    await render(hbs`
      <Menu as |menu|>
        <menu.Button data-test-menu-button>Trigger</menu.Button>
        <menu.Items data-test-menu-items as |items|>
          <items.Item>Item A</items.Item>
          <items.Item>Item B</items.Item>
          <items.Item>Item C</items.Item>
        </menu.Items>
      </Menu>
    `);

    assert.dom('[data-test-menu-button]').hasText('Trigger');

    assertClosedMenuButton('[data-test-menu-button]');

    assertMenuItemsAreCollapsed('[data-test-menu-items]');
  });

  test('controlling open/close programmatically', async function (assert) {
    await render(hbs`
      <Menu as |menu|>
        <button type='button' data-test-open {{on 'click' menu.open}}>Open</button>
        <button type='button' data-test-close {{on 'click' menu.close}}>Close</button>

        <menu.Items data-test-menu-items as |items|>
          <items.Item>Item A</items.Item>
          <items.Item>Item B</items.Item>
          <items.Item>Item C</items.Item>
        </menu.Items>
      </Menu>
    `);

    // Open menu
    await click('[data-test-open]');

    // Verify it is open
    assert.dom('[data-test-menu-items]').exists();

    // Close menu
    await click('[data-test-close]');

    // Verify it is closed
    assert.dom('[data-test-menu-items]').doesNotExist();
  });

  module('Rendering', () => {
    module('Menu', () => {
      test('Menu yields an object', async function (assert) {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger {{if menu.isOpen "visible" "hidden" }}</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item>Item A</items.Item>
              <items.Item>Item B</items.Item>
              <items.Item>Item C</items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify button has "hidden"
        assert.dom('[data-test-menu-button]').hasText('Trigger hidden');

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await click('[data-test-menu-button]');

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        // Verify button has "visible"
        assert.dom('[data-test-menu-button]').hasText('Trigger visible');
        assert.dom('[data-test-menu-items]').isVisible();
      });

      test('Item yields an object', async function (assert) {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger {{if menu.isOpen "visible" "hidden" }}</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element data-test-menu-item>
                  Item A [isActive:{{item.isActive}}] [isDisabled:{{item.isDisabled}}]
                </item.Element>
              </items.Item>
              <items.Item>Item B</items.Item>
              <items.Item>Item C</items.Item>
            </menu.Items>
          </Menu>
        `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify object properties are passed to DOM
        assert
          .dom('[data-test-menu-item]')
          .hasText('Item A [isActive:false] [isDisabled:false]');
      });
    });

    test('it should be possible to use a custom component as a menu item', async function (assert) {
      await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            {{#let (component 'link-to' route="menu") as |Link|}}
              <items.Item as |item|>
                <item.Element @tagName={{Link}} data-test-item-a>
                  Item A
                </item.Element>
              </items.Item>
            {{/let}}
          </menu.Items>
        </Menu>
      `);

      // Open menu
      await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

      // Verify custom component attributes exist
      assert.dom('[data-test-item-a]').hasTagName('a');
      assert.dom('[data-test-item-a]').hasAttribute('href', '/menu');
    });

    test('should be possible to always render the Menu.Items if we provide it a `static` prop', async function (assert) {
      await render(hbs`
        <Menu as |menu|>
          <menu.Button>Trigger</menu.Button>
          <menu.Items data-test-menu-items @static={{true}} as |items|>
              <items.Item>Item A</items.Item>
              <items.Item>Item B</items.Item>
              <items.Item>Item C</items.Item>
          </menu.Items>
        </Menu>
      `);

      assert.dom('[data-test-menu-items]').isVisible();
    });
  });

  module('Keyboard interactions', function () {
    module('`Enter` key', function () {
      test('it should be possible to open the menu with Enter', async function (assert) {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        assertMenuButtonLinkedWithMenuItems(
          '[data-test-menu-button]',
          '[data-test-menu-items]'
        );

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );

        // Verify that the first menu item is active
        assertMenuLinkedWithMenuItem(items[0]);
      });

      test('should not be possible to open the menu with Enter when the button is disabled', async function (assert) {
        assert.expect(9);
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button disabled={{true}}>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        try {
          await triggerKeyEvent(
            '[data-test-menu-button]',
            'keydown',
            Keys.Enter
          );
        } catch (err) {
          assert.ok(
            err.message.startsWith('Can not `triggerKeyEvent` on disabled')
          );
        }

        // Verify it is still closed
        assertClosedMenuButton('[data-test-menu-button]');
      });

      test('it should have no active menu item when there are no menu items at all', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items />
        </Menu>
      `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        assertNoActiveMenuItem();
      });

      test('it should focus the first non disabled menu item when opening with Enter', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify that the first non-disabled menu item is active
        assertMenuLinkedWithMenuItem(items[1]);
      });

      test('it should focus the first non disabled menu item when opening with Enter (jump over multiple disabled ones)', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify that the first non-disabled menu item is active
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should have no active menu item upon Enter key press, when there are no non-disabled menu items', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        assertNoActiveMenuItem();
      });

      test('it should be possible to close the menu with Enter when there is no active menuitem', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        // Close menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Verify the button is focused again
        await assertActiveElement(getMenuButton());
      });

      test('it should be possible to close the menu with Enter and invoke the active menu item', async function (assert) {
        let itemClicked = 0;
        this.set('onClick', (item) => (itemClicked = item.target));

        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element {{on "click" this.onClick}}>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element data-test-item-b {{on "click" this.onClick}}>
                Item B
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        // Activate menu item
        await triggerEvent('[data-test-item-b]', 'mouseover');

        // Close menu and invoke item
        await triggerKeyEvent('[data-test-item-b]', 'keydown', Keys.Enter);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Verify the button is focused again
        await assertActiveElement(getMenuButton());

        // Verify the "click" went through on the `a` tag
        assert.dom(itemClicked).hasText('Item B');
      });

      test('it should be possible to use a button as a menu item and invoke it upon Enter', async function (assert) {
        let itemClicked = 0;
        this.set('onClick', (item) => (itemClicked = item.target));

        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element  data-test-item-a {{on "click" this.onClick}}>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element @tagName="button" data-test-item-b {{on "click" this.onClick}}>
                Item B
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Focus the button
        getMenuButton()?.focus();

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        assert.dom('[data-test-item-a]').hasTagName('a');
        assert.dom('[data-test-item-b]').hasTagName('button');

        // Activate first menu item
        await triggerEvent('[data-test-item-a]', 'mouseover');

        // Close menu, and invoke item
        await triggerKeyEvent('[data-test-item-a]', 'keydown', Keys.Enter);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Verify the item got "clicked"
        assert.dom(itemClicked).hasText('Item A');

        // Verify the button is focused again
        await assertActiveElement(getMenuButton());

        // Click the menu button again
        await click('[data-test-menu-button]');

        // Active the last menu item
        await triggerEvent('[data-test-item-b]', 'mouseover');

        // Close menu, and invoke the item
        await click('[data-test-item-b]', 'keydown', Keys.Enter);

        // Verify the button got "clicked"
        assert.dom(itemClicked).hasText('Item B');

        // Verify the button is focused again
        await assertActiveElement(getMenuButton());
      });
    });

    module('`Space` key', function () {
      test('it should be possible to open the menu with Space', async function (assert) {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Space);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        assertMenuButtonLinkedWithMenuItems(
          '[data-test-menu-button]',
          '[data-test-menu-items]'
        );

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[0]);
      });

      test('should not be possible to open the menu with Space when the button is disabled', async function (assert) {
        assert.expect(9);
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button disabled={{true}}>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Try to open the menu
        try {
          await triggerKeyEvent(
            '[data-test-menu-button]',
            'keydown',
            Keys.Space
          );
        } catch (err) {
          assert.ok(
            err.message.startsWith('Can not `triggerKeyEvent` on disabled')
          );
        }

        // Verify that it is still closed
        assertClosedMenuButton('[data-test-menu-button]');
      });

      test('it should have no active menu item when there are no menu items at all', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items />
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Space);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        assertNoActiveMenuItem();
      });

      test('it should focus the first non disabled menu item when opening with Space', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Space);

        const items = getMenuItems();

        // Verify that the first non-disabled menu item is active
        assertMenuLinkedWithMenuItem(items[1]);
      });

      test('it should focus the first non disabled menu item when opening with Space (jump over multiple disabled ones)', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Space);

        const items = getMenuItems();

        // Verify that the first non-disabled menu item is active
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should have no active menu item upon Space key press, when there are no non-disabled menu items', async function (assert) {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Space);

        // Verify is has menu items
        const items = getMenuItems();

        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );

        assertNoActiveMenuItem();
      });

      test('it should be possible to close the menu with Space when there is no active menuitem', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await click('[data-test-menu-button]');

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        // Close menu
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.Space);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Verify the button is focused again
        await assertActiveElement(getMenuButton());
      });

      test('it should be possible to close the menu with Space and invoke the active menu item', async function (assert) {
        let itemClicked = 0;
        this.set('onClick', (item) => (itemClicked = item.target));

        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element data-test-item-a {{on "click" this.onClick}}>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        // Activate first menu item
        await triggerEvent('[data-test-item-a]', 'mouseover');

        // Close menu and invoke the item
        await triggerKeyEvent('[data-test-item-a]', 'keydown', Keys.Space);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Verify the "click" ent through on the `a` tag
        assert.dom(itemClicked).hasText('Item A');

        // Verify the button is focused again
        await assertActiveElement(getMenuButton());
      });
    });

    module('`Escape` key', () => {
      test('it should be possible to close the menu with Escape', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Focus the button
        getMenuButton()?.focus();

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Space);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        // Close menu
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.Escape);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Verify the button is focused again
        await assertActiveElement(getMenuButton());
      });
    });

    module('`Tab` key', () => {
      test('it should focus trap when we use Tab', async function (assert) {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[0]);

        // Try to Tab
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.Tab);

        // Verify it is still open
        assertOpenMenuButton('[data-test-menu-button]');
      });

      test('it should focus trap when we use Shift+Tab', async function (assert) {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[0]);

        // Try to Shit+Tab
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.Tab, {
          shiftKey: true,
        });

        // Verify it is still open
        assertOpenMenuButton('[data-test-menu-button]');
      });
    });

    module('`ArrowDown` key', () => {
      test('it should be possible to open the menu with ArrowDown', async function (assert) {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowDown
        );

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        // Verify it is open
        assertMenuButtonLinkedWithMenuItems(
          '[data-test-menu-button]',
          '[data-test-menu-items]'
        );

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );

        // Verify that the first menu item is active
        assertMenuLinkedWithMenuItem(items[0]);
      });

      test('it should have no active menu item when there are no menu items at all', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items />
        </Menu>
      `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowDown
        );

        // Verify it is open
        assertOpenMenuButton('[data-test-menu-button]');

        assertNoActiveMenuItem();
      });

      test('should not be possible to open the menu with ArrowDown when the button is disabled', async function (assert) {
        assert.expect(9);
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button disabled={{true}}>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Try to open the menu
        try {
          await triggerKeyEvent(
            '[data-test-menu-button]',
            'keydown',
            Keys.ArrowDown
          );
        } catch (err) {
          assert.ok(
            err.message.startsWith('Can not `triggerKeyEvent` on disabled')
          );
        }

        // Verify it is still closed
        assertClosedMenuButton('[data-test-menu-button]');
      });

      test('it should be possible to use ArrowDown to navigate the menu items', async function (assert) {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowDown
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[0]);

        // We should be able to go down once
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.ArrowDown
        );
        assertMenuLinkedWithMenuItem(items[1]);

        // We should be able to go down again
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.ArrowDown
        );
        assertMenuLinkedWithMenuItem(items[2]);

        // We should NOT be able to go down again (because last item). Current implementation won't go around.
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.ArrowDown
        );
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should be possible to use ArrowDown to navigate the menu items and skip the first disabled one', async function (assert) {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowDown
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[1]);

        // We should be able to go down once
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.ArrowDown
        );
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should be possible to use ArrowDown to navigate the menu items and jump to the first non-disabled one', async function (assert) {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element >
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowDown
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[2]);
      });
    });

    module('`ArrowUp` key', () => {
      test('it should be possible to open the menu with ArrowUp and the last item should be active', async function (assert) {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Menu open
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowUp
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // Verify it is open
        assertMenuButtonLinkedWithMenuItems(
          '[data-test-menu-button]',
          '[data-test-menu-items]'
        );

        const items = getMenuItems();

        // ! ALERT: The LAST item should now be active
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should have no active menu item when there are no menu items at all', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items />
        </Menu>
      `);

        // Verify it is closed
        assertClosedMenuButton('[data-test-menu-button]');

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowUp
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        assertNoActiveMenuItem();
      });

      test('it should be possible to use ArrowUp to navigate the menu items and jump to the first non-disabled one', async function (assert) {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowUp
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should not be possible to navigate up or down if there is only a single non-disabled item', async function (assert) {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowUp
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[2]);

        // We should not be able to go up (because those are disabled)
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.ArrowUp
        );
        assertMenuLinkedWithMenuItem(items[2]);

        // We should not be able to go down (because this is the last item)
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.ArrowDown
        );
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should be possible to use ArrowUp to navigate the menu items', async function (assert) {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowUp
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // Verify we have menu items
        assert.strictEqual(
          items.length,
          3,
          'There are three visible menu items'
        );
        assertMenuLinkedWithMenuItem(items[2]);

        // We should be able to go up once
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.ArrowUp
        );
        assertMenuLinkedWithMenuItem(items[1]);

        // We should be able to go up again
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.ArrowUp
        );
        assertMenuLinkedWithMenuItem(items[0]);

        // We should NOT be able to go up again (because first item). Current implementation won't go around.
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.ArrowUp
        );
        assertMenuLinkedWithMenuItem(items[0]);
      });
    });

    module('`End` key', () => {
      test('it should be possible to use the End key to go to the last menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // we should be on the first item
        assertMenuLinkedWithMenuItem(items[0]);

        // We should be able to go to the last item
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.End);
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should be possible to use the End key to go to the last non disabled menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // we should be on the first item
        assertMenuLinkedWithMenuItem(items[0]);

        // We should be able to go to the last non-disabled item
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.End);
        assertMenuLinkedWithMenuItem(items[1]);
      });

      test('it should be possible to use the End key to go to the first menu item if that is the only non-disabled menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should not be able to go to the end
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.End);

        const items = getMenuItems();
        assertMenuLinkedWithMenuItem(items[0]);
      });

      test('it should have no active menu item upon End key press, when there are no non-disabled menu items', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should not be able to go to the end
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.End);

        assertNoActiveMenuItem();
      });
    });

    module('`PageDown` key', () => {
      test('it should be possible to use the PageDown key to go to the last menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // we should be on the first item
        assertMenuLinkedWithMenuItem(items[0]);

        // We should be able to go to the last item
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.PageDown
        );
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should be possible to use the PageDown key to go to the last non disabled menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent('[data-test-menu-button]', 'keydown', Keys.Enter);

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // we should be on the first item
        assertMenuLinkedWithMenuItem(items[0]);

        // We should be able to go to the last non-disabled item
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.PageDown
        );
        assertMenuLinkedWithMenuItem(items[1]);
      });

      test('it should be possible to use the PageDown key to go to the first menu item if that is the only non-disabled menu item', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  Item A
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item B
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item C
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  Item D
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should not be able to go to the end
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.PageDown
        );

        const items = getMenuItems();
        assertMenuLinkedWithMenuItem(items[0]);
      });

      test('it should have no active menu item upon PageDown key press, when there are no non-disabled menu items', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should not be able to go to the end
        await triggerKeyEvent(
          '[data-test-menu-items]',
          'keydown',
          Keys.PageDown
        );

        assertNoActiveMenuItem();
      });
    });

    module('`Home` key', () => {
      test('it should be possible to use the Home key to go to the first menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowUp
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // We should be on the last item
        assertMenuLinkedWithMenuItem(items[2]);

        // We should be able to go to the first item
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.Home);
        assertMenuLinkedWithMenuItem(items[0]);
      });

      test('it should be possible to use the Home key to go to the first non disabled menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should not be able to go to the end
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.Home);

        const items = getMenuItems();

        // We should be on the first non-disabled item
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should be possible to use the Home key to go to the last menu item if that is the only non-disabled menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should not be able to go to the end
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.Home);

        const items = getMenuItems();
        assertMenuLinkedWithMenuItem(items[3]);
      });

      test('it should have no active menu item upon Home key press, when there are no non-disabled menu items', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should not be able to go to the end
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.Home);

        assertNoActiveMenuItem();
      });
    });

    module('`PageUp` key', () => {
      test('it should be possible to use the PageUp key to go to the first menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowUp
        );

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        const items = getMenuItems();

        // we should be on the last item
        assertMenuLinkedWithMenuItem(items[2]);

        // We should be able to go to the first item
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.PageUp);
        assertMenuLinkedWithMenuItem(items[0]);
      });

      test('it should be possible to use the PageUp key to go to the first non disabled menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should be able to go to the end
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.PageUp);

        const items = getMenuItems();

        // We should be on the first non-disabled item
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should be possible to use the PageUp key to go to the last menu item if that is the only non-disabled menu item', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should not be able to go to the end
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.PageUp);

        const items = getMenuItems();
        assertMenuLinkedWithMenuItem(items[3]);
      });

      test('it should have no active menu item upon PageUp key press, when there are no non-disabled menu items', async function () {
        await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <menu.Items data-test-menu-items as |items|>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item A
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item B
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item C
              </item.Element>
            </items.Item>
            <items.Item @isDisabled={{true}} as |item|>
              <item.Element>
                Item D
              </item.Element>
            </items.Item>
          </menu.Items>
        </Menu>
      `);

        // Open menu
        await click('[data-test-menu-button]');

        // Verify is it open
        assertOpenMenuButton('[data-test-menu-button]');

        // We opened via click, we don't have an active item
        assertNoActiveMenuItem();

        // We should not be able to go to the end
        await triggerKeyEvent('[data-test-menu-items]', 'keydown', Keys.PageUp);

        assertNoActiveMenuItem();
      });
    });

    module('`Any` key aka search', function () {
      test('it should be possible to type a full word that has a perfect match', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  alice
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  bob
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        await click('[data-test-menu-button]');
        await type('[data-test-menu-items]', 'bob');

        const items = getMenuItems();

        assertMenuLinkedWithMenuItem(items[1]);
      });

      test('it should be possible to type a partial of a word', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  alice
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  bob
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        await click('[data-test-menu-button]');
        await type('[data-test-menu-items]', 'bo');

        const items = getMenuItems();

        assertMenuLinkedWithMenuItem(items[1]);

        await type('[data-test-menu-items]', 'ali');

        assertMenuLinkedWithMenuItem(items[0]);
      });

      test('it should be possible to type words with spaces', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  value a
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  value b
                </item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>
                  value c
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        await triggerKeyEvent(
          '[data-test-menu-button]',
          'keydown',
          Keys.ArrowUp
        );

        const items = getMenuItems();

        // We should be on the last item
        assertMenuLinkedWithMenuItem(items[2]);

        // We should be able to go to the second item
        await type('[data-test-menu-items]', 'value b');
        assertMenuLinkedWithMenuItem(items[1]);

        // We should be able to go to the first item
        await type('[data-test-menu-items]', 'value a');
        assertMenuLinkedWithMenuItem(items[0]);

        // We should be able to go to the last item
        await type('[data-test-menu-items]', 'value c');
        assertMenuLinkedWithMenuItem(items[2]);
      });

      test('it should not be possible to search for a disabled item', async function () {
        await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>
                  alice
                </item.Element>
              </items.Item>
              <items.Item @isDisabled={{true}} as |item|>
                <item.Element>
                  bob
                </item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

        await click('[data-test-menu-button]');
        await type('[data-test-menu-items]', 'bob');

        assertNoActiveMenuItem('[data-test-menu-items]');
      });
    });
  });

  module('Mouse interactions', function () {
    test('it should be possible to open and close a menu on click', async function (assert) {
      await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>Item A</item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>Item B</item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>Item C</item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

      // Verify it is closed
      assertClosedMenuButton('[data-test-menu-button]');

      // Open menu
      await click('[data-test-menu-button]');

      // Verify is it open
      assertOpenMenuButton('[data-test-menu-button]');

      assertMenuButtonLinkedWithMenuItems(
        '[data-test-menu-button]',
        '[data-test-menu-items]'
      );

      const items = getMenuItems();

      // Verify we have menu items
      assert.strictEqual(items.length, 3, 'There are three visible menu items');

      // Close menu
      await click('[data-test-menu-button]');

      // Verify is it closed
      assertClosedMenuButton('[data-test-menu-button]');
    });

    // - it should focus the menu when you try to focus the button again (when the menu is already open)
    // - it should be a no-op when we click outside of a closed menu
    test('it should be possible to click outside of the menu which should close the menu', async function (assert) {
      await render(hbs`
          <Menu as |menu|>
            <menu.Button data-test-menu-button>Trigger</menu.Button>
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>Item A</item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>Item B</item.Element>
              </items.Item>
              <items.Item as |item|>
                <item.Element>Item C</item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

      // Open menu
      await click('[data-test-menu-button]');

      // Verify is it open
      assertOpenMenuButton('[data-test-menu-button]');

      // Click something that is not related to the menu
      await click(document.body);

      // Should be closed now
      assertClosedMenuButton('[data-test-menu-button]');

      // Verify the button is focused again
      assert.dom('[data-test-menu-button]').isFocused();
    });

    test('it should not focus button when does not exist', async function (assert) {
      this.set('isShowButton', true);
      await render(hbs`
          <Menu as |menu|>
            {{#if this.isShowButton}}
              <menu.Button data-test-menu-button>Trigger</menu.Button>
            {{/if}}
            <menu.Items data-test-menu-items as |items|>
              <items.Item as |item|>
                <item.Element>Item A</item.Element>
              </items.Item>
            </menu.Items>
          </Menu>
        `);

      // Open menu
      await click('[data-test-menu-button]');

      // Verify it is open
      assertOpenMenuButton('[data-test-menu-button]');

      // Hide button
      this.set('isShowButton', false);

      // Click something that is not related to the menu
      await click(document.body);

      // Verify the button does not exist
      assert.dom('[data-test-menu-button]').doesNotExist();
    });
    // - it should be possible to click outside of the menu which should close the menu (even if we press the menu button)
    // - it should be possible to click outside of the menu on another menu button which should close the current menu and open the new menu
    // - it should be possible to hover an item and make it active
    // - it should make a menu item active when you move the mouse over it
    // - it should be a no-op when we move the mouse and the menu item is already active
    // - it should be a no-op when we move the mouse and the menu item is disabled
    // - it should not be possible to hover an item that is disabled
    // - it should be possible to mouse leave an item and make it inactive
    // - it should be possible to mouse leave a disabled item and be a no-op
    // - it should be possible to click a menu item, which closes the menu
    // - it should be possible to click a menu item, which closes the menu and invokes the @click handler
    // - it should be possible to click a disabled menu item, which is a no-op
    // - it should be possible focus a menu item, so that it becomes active
    // - it should not be possible to focus a menu item which is disabled
    // - it should not be possible to activate a disabled item
  });

  let getDebugOrder = function () {
    let order = [];

    this.owner.register(
      'component:debug',
      class DebugComponent extends Component {
        constructor() {
          super(...arguments);
          order.push('Mounting - ' + this.args.name);
        }

        willDestroy() {
          order.push('Unmounting - ' + this.args.name);
        }
      }
    );

    return order;
  };

  module('Menu composition', () => {
    test('should be possible to wrap the Menu.Items with a Transition component', async function (assert) {
      let order = getDebugOrder.call(this);
      await render(hbs`
        <Menu as |menu|>
          <menu.Button data-test-menu-button>Trigger</menu.Button>
          <Debug @name="Menu"/>
          <Transition @show={{menu.isOpen}}>
            <Debug @name="Transition"/>
            <menu.Items
              data-test-menu-items
              @isOpen={{true}}
              as |items|
            >
              <items.Item as |item|>
                <Debug @name="Menu.Item"/>
                <item.Element>
                  my menu item
                </item.Element>
              </items.Item>
            </menu.Items>
          </Transition>
        </Menu>
      `);
      assertClosedMenuButton('[data-test-menu-button]');
      assert.dom('[data-test-menu-items]').doesNotExist();

      await click('[data-test-menu-button]');
      assertOpenMenuButton('[data-test-menu-button]');
      assert.dom('[data-test-menu-items]').isVisible();

      await click('[data-test-menu-button]');

      assert.deepEqual(order, [
        'Mounting - Menu',
        'Mounting - Transition',
        'Mounting - Menu.Item',
        'Unmounting - Transition',
        'Unmounting - Menu.Item',
      ]);
    });
  });
});
