// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***************************************************************
// - [#] indicates a test step (e.g. # Go to a page)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element ID when selecting an element. Create one if none.
// ***************************************************************

// Group: @enterprise @ldap_group

import * as TIMEOUTS from '../../../fixtures/timeouts';

// # Save setting and get back to the resource page
const saveAndNavigateBackTo = (name) => {
    cy.get('#saveSetting').should('be.enabled').click({force: true});

    cy.findByTestId('search-input').should('be.visible').type(`${name}{enter}`).wait(TIMEOUTS.TINY);
    cy.findByTestId(`${name}edit`).should('be.visible').click();
};

const changeRoleTo = (role) => {
    cy.get('#role-to-be > button').should('be.visible').and('have.text', role).click();
    cy.findByTestId('current-role').should('have.text', role).wait(TIMEOUTS.TINY);
};

describe('System Console', () => {
    const groupDisplayName = 'board';
    let team;

    before(() => {
        // # Login as sysadmin
        cy.apiLogin('sysadmin');

        // * Check if server has license for LDAP Groups
        cy.requireLicenseForFeature('LDAPGroups');

        // # Get the test team and link "board" group
        cy.apiGetTeamByName('ad-1').then((resTeam) => {
            team = resTeam.body;

            cy.apiGetLDAPGroups().then((res) => {
                res.body.groups.forEach((group) => {
                    if (group.name === groupDisplayName) {
                        cy.apiAddLDAPGroupLink(group.primary_key);
                    }
                });
            });
        });
    });

    beforeEach(() => {
        cy.apiGetTeamGroups(team.id).then((resGroups) => {
            resGroups.body.groups.forEach((group) => {
                if (group.display_name === groupDisplayName) {
                    cy.apiDeleteLinkFromTeamToGroup(group.id, team.id);
                }
            });
        });
    });

    it('MM-20059 - System Admin can map roles to groups from Team Configuration screen', () => {
        const teamName = 'eligendi';

        // # Go to system admin page and to team configuration page of channel "eligendi"
        cy.visit('/admin_console/user_management/teams');

        // # Search for the team.
        cy.findByTestId('search-input').type(`${teamName}{enter}`);
        cy.findByTestId(`${teamName}edit`).click();

        // # Add the first group in the group list then save
        cy.findByTestId('addGroupsToTeamToggle').scrollIntoView().click();
        cy.get('#multiSelectList').should('be.visible');
        cy.get('#multiSelectList>div').children().eq(0).click();
        cy.get('#saveItems').click();

        // * Ensure default role is Member
        cy.findByTestId('current-role').scrollIntoView().should('be.visible').should('have.text', 'Member').click();

        // * Assert that only one option exists in the dropdown for changing roles
        cy.get('#role-to-be-menu').then((el) => {
            expect(el[0].firstElementChild.children.length).equal(1);
        });

        // # Continue changing the role to Team Admin
        changeRoleTo('Team Admin');

        // # Save the setting and navigate back to page
        saveAndNavigateBackTo(teamName);

        // * Check to make the the current role text is displayed as Team Admin
        cy.findByTestId('current-role').should('have.text', 'Team Admin');

        // # Change the role from Team Admin to Member
        cy.findByTestId('current-role').click();

        // * Assert that only one option exists in the dropdown for changing roles
        cy.get('#role-to-be-menu').then((el) => {
            expect(el[0].firstElementChild.children.length).equal(1);
        });

        // # Change role to member
        changeRoleTo('Member');

        // # Save the setting and navigate back to page
        saveAndNavigateBackTo(teamName);

        // * Check to make the the current role text is displayed as Member
        cy.findByTestId('current-role').should('have.text', 'Member');

        // # Remove "board" group
        cy.get('.group-row').eq(0).scrollIntoView().should('be.visible').within(() => {
            cy.get('.group-name').should('have.text', groupDisplayName);
            cy.get('.group-actions > a').should('have.text', 'Remove').click({force: true});
        });

        // * Assert that the group was removed successfully
        cy.get('#groups-list--body').then((el) => {
            expect(el[0].childNodes[0].innerText).equal('No groups specified yet');
        });

        // # Save the setting and navigate back to page
        saveAndNavigateBackTo(teamName);

        // * Assert that the group was removed successfully
        cy.get('#groups-list--body').then((el) => {
            expect(el[0].childNodes[0].innerText).equal('No groups specified yet');
        });
    });

    it('MM-21789 - Add a group and change the role and then save and ensure the role was updated on team configuration page', () => {
        const teamName = 'eligendi';

        // # Go to system admin page and to team configuration page of channel "eligendi"
        cy.visit('/admin_console/user_management/teams');

        // # Search for the team.
        cy.findByTestId('search-input').type(`${teamName}{enter}`);
        cy.findByTestId(`${teamName}edit`).click();

        // # Add the first group in the group list then save
        cy.findByTestId('addGroupsToTeamToggle').click();
        cy.get('#multiSelectList').should('be.visible');
        cy.get('#multiSelectList>div').children().eq(0).click();
        cy.get('#saveItems').click();

        // * Ensure default role is Member
        cy.findByTestId('current-role').should('have.text', 'Member').click();

        // * Assert that only one option exists in the dropdown for changing roles
        cy.get('#role-to-be-menu').then((el) => {
            expect(el[0].firstElementChild.children.length).equal(1);
        });

        // # Continue changing the role to Team Admin and save
        changeRoleTo('Team Admin');

        // # Save the setting and navigate back to page
        saveAndNavigateBackTo(teamName);

        // * Check to make the the current role text is displayed as Team Admin
        cy.findByTestId('current-role').should('have.text', 'Team Admin');
    });

    it('MM-20646 - System Admin can map roles to groups from Channel Configuration screen', () => {
        const channelName = 'autem';

        // # Go to system admin page and to channel configuration page of channel "autem"
        cy.visit('/admin_console/user_management/channels');

        // # Search for the channel.
        cy.findByTestId('search-input').type(`${channelName}{enter}`);
        cy.findByTestId(`${channelName}edit`).click();

        // # Add the first group in the group list then save
        cy.findByTestId('addGroupsToChannelToggle').click();
        cy.get('#multiSelectList').should('be.visible');
        cy.get('#multiSelectList>div').children().eq(0).click();
        cy.get('#saveItems').click();
        saveAndNavigateBackTo(channelName);

        // * Ensure default role is Member
        cy.findByTestId('current-role').scrollIntoView().should('have.text', 'Member').click();

        // * Assert that only one option exists in the dropdown for changing roles
        cy.get('#role-to-be-menu').then((el) => {
            expect(el[0].firstElementChild.children.length).equal(1);
        });

        // # Continue changing the role to Channel Admin
        changeRoleTo('Channel Admin');

        // # Save the setting and navigate back to page
        saveAndNavigateBackTo(channelName);

        // * Check to make the the current role text is displayed as Channel Admin
        cy.findByTestId('current-role').should('have.text', 'Channel Admin');

        // # Change the role from Channel Admin to member
        cy.findByTestId('current-role').scrollIntoView().should('be.visible').click();

        // * Assert that only one option exists in the dropdown for changing roles
        cy.get('#role-to-be-menu').then((el) => {
            expect(el[0].firstElementChild.children.length).equal(1);
        });

        // # Change role to Member
        changeRoleTo('Member');

        // # Save the setting and navigate back to page
        saveAndNavigateBackTo(channelName);

        // * Check to make the the current role text is displayed as Member
        cy.findByTestId('current-role').should('have.text', 'Member');
    });

    it('MM-21789 - Add a group and change the role and then save and ensure the role was updated on channel configuration page', () => {
        const channelName = 'autem';

        // # Go to system admin page and to channel configuration page of channel "autem"
        cy.visit('/admin_console/user_management/channels');

        // # Search for the channel.
        cy.findByTestId('search-input').type(`${channelName}{enter}`);
        cy.findByTestId(`${channelName}edit`).click();

        // # Add the first group in the group list then save
        cy.findByTestId('addGroupsToChannelToggle').click();
        cy.get('#multiSelectList').should('be.visible');
        cy.get('#multiSelectList>div').children().eq(0).click();
        cy.get('#saveItems').click();

        // * Ensure default role is Member
        cy.findByTestId('current-role').should('have.text', 'Member').click();

        // * Assert that only one option exists in the dropdown for changing roles
        cy.get('#role-to-be-menu').then((el) => {
            expect(el[0].firstElementChild.children.length).equal(1);
        });

        // # Continue changing the role to Channel Admin
        changeRoleTo('Channel Admin');

        // # Save the setting and navigate back to page
        saveAndNavigateBackTo(channelName);

        // * Check to make the the current role text is displayed as Channel Admin
        cy.findByTestId('current-role').should('have.text', 'Channel Admin');
    });
});
