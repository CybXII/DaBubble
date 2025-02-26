'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">dabubble documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AddchatComponent.html" data-type="entity-link" >AddchatComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AddUserToChannelComponent.html" data-type="entity-link" >AddUserToChannelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BuilderComponent.html" data-type="entity-link" >BuilderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChatboxComponent.html" data-type="entity-link" >ChatboxComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChatComponent.html" data-type="entity-link" >ChatComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChooseAvatarComponent.html" data-type="entity-link" >ChooseAvatarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CreatemessageComponent.html" data-type="entity-link" >CreatemessageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DialogComponent.html" data-type="entity-link" >DialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditmessageComponent.html" data-type="entity-link" >EditmessageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EmojiPickerComponent.html" data-type="entity-link" >EmojiPickerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ForgetPasswordComponent.html" data-type="entity-link" >ForgetPasswordComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HeaderComponent.html" data-type="entity-link" >HeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImprintComponent.html" data-type="entity-link" >ImprintComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LegalnoticeComponent.html" data-type="entity-link" >LegalnoticeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginComponent.html" data-type="entity-link" >LoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LogoComponent.html" data-type="entity-link" >LogoComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MainchatHeaderComponent.html" data-type="entity-link" >MainchatHeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MainComponent.html" data-type="entity-link" >MainComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MentionComponent.html" data-type="entity-link" >MentionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MenuChannelsComponent.html" data-type="entity-link" >MenuChannelsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MenuComponent.html" data-type="entity-link" >MenuComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MenuDialogComponent.html" data-type="entity-link" >MenuDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MenuHeaderComponent.html" data-type="entity-link" >MenuHeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MenuPrivateMessagesComponent.html" data-type="entity-link" >MenuPrivateMessagesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MenutogglerComponent.html" data-type="entity-link" >MenutogglerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MessageboxComponent.html" data-type="entity-link" >MessageboxComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MessageComponent.html" data-type="entity-link" >MessageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ParentMessageComponent.html" data-type="entity-link" >ParentMessageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProfileviewComponent.html" data-type="entity-link" >ProfileviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReactionsComponent.html" data-type="entity-link" >ReactionsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ResetPasswordComponent.html" data-type="entity-link" >ResetPasswordComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SearchbarComponent.html" data-type="entity-link" >SearchbarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SignInComponent.html" data-type="entity-link" >SignInComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SignUpComponent.html" data-type="entity-link" >SignUpComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ThreadchatHeaderComponent.html" data-type="entity-link" >ThreadchatHeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ThreadMessagesComponent.html" data-type="entity-link" >ThreadMessagesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ToastMessageComponent.html" data-type="entity-link" >ToastMessageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UsermenuComponent.html" data-type="entity-link" >UsermenuComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/UserModel.html" data-type="entity-link" >UserModel</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ChannelsService.html" data-type="entity-link" >ChannelsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EmojiPickerService.html" data-type="entity-link" >EmojiPickerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EmojiStorageService.html" data-type="entity-link" >EmojiStorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MentionService.html" data-type="entity-link" >MentionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MessagesService.html" data-type="entity-link" >MessagesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SaveEditMessageService.html" data-type="entity-link" >SaveEditMessageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SearchService.html" data-type="entity-link" >SearchService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SharedService.html" data-type="entity-link" >SharedService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StateService.html" data-type="entity-link" >StateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ToastMessageService.html" data-type="entity-link" >ToastMessageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserDialogService.html" data-type="entity-link" >UserDialogService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Channel.html" data-type="entity-link" >Channel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomUser.html" data-type="entity-link" >CustomUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Message.html" data-type="entity-link" >Message</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Reaction.html" data-type="entity-link" >Reaction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ThreadMessage.html" data-type="entity-link" >ThreadMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToastMessage.html" data-type="entity-link" >ToastMessage</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#pipes-links"' :
                                'data-bs-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/RelativeDatePipe.html" data-type="entity-link" >RelativeDatePipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/TimestampToDatePipe.html" data-type="entity-link" >TimestampToDatePipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});