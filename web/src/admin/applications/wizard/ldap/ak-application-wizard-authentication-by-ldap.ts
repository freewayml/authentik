import "@goauthentik/admin/common/ak-core-group-search";
import "@goauthentik/admin/common/ak-crypto-certificate-search";
import "@goauthentik/admin/common/ak-flow-search/ak-tenanted-flow-search";
import { first } from "@goauthentik/common/utils";
import "@goauthentik/components/ak-number-input";
import "@goauthentik/components/ak-radio-input";
import "@goauthentik/components/ak-switch-input";
import "@goauthentik/components/ak-text-input";
import { rootInterface } from "@goauthentik/elements/Base";
import "@goauthentik/elements/forms/FormGroup";
import "@goauthentik/elements/forms/HorizontalFormElement";

import { msg } from "@lit/localize";
import { customElement } from "@lit/reactive-element/decorators/custom-element.js";
import { html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

import { FlowsInstancesListDesignationEnum, LDAPAPIAccessMode } from "@goauthentik/api";
import type { LDAPProvider } from "@goauthentik/api";

import ApplicationWizardPageBase from "../ApplicationWizardPageBase";

const bindModeOptions = [
    {
        label: msg("Cached binding"),
        value: LDAPAPIAccessMode.Cached,
        default: true,
        description: html`${msg(
            "Flow is executed and session is cached in memory. Flow is executed when session expires",
        )}`,
    },
    {
        label: msg("Direct binding"),
        value: LDAPAPIAccessMode.Direct,
        description: html`${msg(
            "Always execute the configured bind flow to authenticate the user",
        )}`,
    },
];

const searchModeOptions = [
    {
        label: msg("Cached querying"),
        value: LDAPAPIAccessMode.Cached,
        default: true,
        description: html`${msg(
            "The outpost holds all users and groups in-memory and will refresh every 5 Minutes",
        )}`,
    },
    {
        label: msg("Direct querying"),
        value: LDAPAPIAccessMode.Direct,
        description: html`${msg(
            "Always returns the latest data, but slower than cached querying",
        )}`,
    },
];

const groupHelp = msg(
    "Users in the selected group can do search queries. If no group is selected, no LDAP Searches are allowed.",
);

const mfaSupportHelp = msg(
    "When enabled, code-based multi-factor authentication can be used by appending a semicolon and the TOTP code to the password. This should only be enabled if all users that will bind to this provider have a TOTP device configured, as otherwise a password may incorrectly be rejected if it contains a semicolon.",
);

@customElement("ak-application-wizard-authentication-by-ldap")
export class ApplicationWizardApplicationDetails extends ApplicationWizardPageBase {
    handleChange(ev: InputEvent) {
        if (!ev.target) {
            console.warn(`Received event with no target: ${ev}`);
            return;
        }
        const target = ev.target as HTMLInputElement;
        const value = target.type === "checkbox" ? target.checked : target.value;
        this.dispatchWizardUpdate({
            provider: {
                ...this.wizard.provider,
                [target.name]: value,
            },
        });
    }

    render() {
        const provider = this.wizard.provider as LDAPProvider | undefined;

        // prettier-ignore
        return html` <form class="pf-c-form pf-m-horizontal" @input=${this.handleChange}>
            <ak-text-input
                name="name"
                value=${ifDefined(provider?.name)}
                label=${msg("Name")}
                required
                help=${msg("Method's display Name.")}
            ></ak-text-input>

            <ak-form-element-horizontal
                label=${msg("Bind flow")}
                ?required=${true}
                name="authorizationFlow"
            >
                <ak-tenanted-flow-search
                    flowType=${FlowsInstancesListDesignationEnum.Authentication}
                    .currentFlow=${provider?.authorizationFlow}
                    .tenantFlow=${rootInterface()?.tenant?.flowAuthentication}
                    required
                ></ak-tenanted-flow-search>
                <p class="pf-c-form__helper-text">${msg("Flow used for users to authenticate.")}</p>
            </ak-form-element-horizontal>

            <ak-form-element-horizontal label=${msg("Search group")} name="searchGroup">
                <ak-core-group-search
                    name="searchGroup"
                    group=${ifDefined(provider?.searchGroup ?? nothing)}
                ></ak-core-group-search>
                <p class="pf-c-form__helper-text">${groupHelp}</p>
            </ak-form-element-horizontal>

            <ak-radio-input
                label=${msg("Bind mode")}
                name="bindMode"
                .options=${bindModeOptions}
                .value=${provider?.bindMode}
                help=${msg("Configure how the outpost authenticates requests.")}
            >
            </ak-radio-input>

            <ak-radio-input
                label=${msg("Search mode")}
                name="searchMode"
                .options=${searchModeOptions}
                .value=${provider?.searchMode}
                help=${msg("Configure how the outpost queries the core authentik server's users.")}
            >
            </ak-radio-input>

            <ak-switch-input
                name="openInNewTab"
                label=${msg("Code-based MFA Support")}
                ?checked=${provider?.mfaSupport}
                help=${mfaSupportHelp}
            >
            </ak-switch-input>

            <ak-form-group .expanded=${true}>
                <span slot="header"> ${msg("Protocol settings")} </span>
                <div slot="body" class="pf-c-form">
                    <ak-text-input
                        name="baseDn"
                        label=${msg("Base DN")}
                        required
                        value="${first(
                            provider?.baseDn,
                            "DC=ldap,DC=goauthentik,DC=io"
                        )}"
                        help=${msg(
                            "LDAP DN under which bind requests and search requests can be made."
                        )}
                    >
                    </ak-text-input>

                    <ak-form-element-horizontal label=${msg("Certificate")} name="certificate">
                        <ak-crypto-certificate-search
                            certificate=${ifDefined(provider?.certificate ?? nothing)}
                            name="certificate"
                        >
                        </ak-crypto-certificate-search>
                        <p class="pf-c-form__helper-text">
                            ${msg(
                                "The certificate for the above configured Base DN. As a fallback, the provider uses a self-signed certificate."
                            )}
                        </p>
                    </ak-form-element-horizontal>

                    <ak-text-input
                        label=${msg("TLS Server name")}
                        required
                        name="tlsServerName"
                        value="${first(provider?.tlsServerName, "")}"
                        help=${msg(
                            "DNS name for which the above configured certificate should be used. The certificate cannot be detected based on the base DN, as the SSL/TLS negotiation happens before such data is exchanged."
                        )}
                    ></ak-text-input>

                    <ak-number-input
                        label=${msg("UID start number")}
                        required
                        name="uidStartNumber"
                        value="${first(provider?.uidStartNumber, 2000)}"
                        help=${msg(
                            "The start for uidNumbers, this number is added to the user.Pk to make sure that the numbers aren't too low for POSIX users. Default is 2000 to ensure that we don't collide with local users uidNumber"
                        )}
                    ></ak-number-input>

                    <ak-number-input
                        label=${msg("GID start number")}
                        required
                        name="gidStartNumber"
                        value="${first(provider?.gidStartNumber, 4000)}"
                        help=${msg(
                            "The start for gidNumbers, this number is added to a number generated from the group.Pk to make sure that the numbers aren't too low for POSIX groups. Default is 4000 to ensure that we don't collide with local groups or users primary groups gidNumber"
                        )}
                    ></ak-number-input>
                </div>
            </ak-form-group>
        </form>`;
    }
}

export default ApplicationWizardApplicationDetails;
