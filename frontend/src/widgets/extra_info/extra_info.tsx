import React from 'react';
import { Route, Switch } from 'react-router-dom';
import TermsOfUsePage from './TermsOfUsePage';
import ContactsPage from './ContactsPage';
import DocumentsPage from './DocumentsPage';
import RecommendationPolicyPage from './RecommendationPolicyPage';
import HomePage from './HomePage'; // Замени на компонент главной страницы

const MainContent: React.FC = () => {
    return (
        <Switch>
            <Route exact path="/">
                <HomePage />
            </Route>
            <Route path="/terms-of-use">
                <TermsOfUsePage />
            </Route>
            <Route path="/contacts">
                <ContactsPage />
            </Route>
            <Route path="/documents">
                <DocumentsPage />
            </Route>
            <Route path="/recommendation-policy">
                <RecommendationPolicyPage />
            </Route>
        </Switch>
    );
};

export default MainContent;