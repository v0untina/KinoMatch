import React from 'react';
import './extra_info.css';

const DocumentsPage: React.FC = () => {
    return (
        <div>
            <h1>Документы</h1>
            <p>Здесь вы можете найти наши основные документы:</p>
            <ul>
                <li><a href="/documents/document1.pdf">Положение о конфиденциальности</a></li>
                <li><a href="/documents/document2.pdf">Пользовательское соглашение</a></li>
                <li><a href="/documents/document3.pdf">Лицензионное соглашение</a></li>
            </ul>
        </div>
    );
};

export default DocumentsPage;