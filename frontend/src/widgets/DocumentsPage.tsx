import React from 'react';
import './extra_info.css';

const DocumentsPage: React.FC = () => {
    return (
        <div>
            <h1>���������</h1>
            <p>����� �� ������ ����� ���� �������� ���������:</p>
            <ul>
                <li><a href="/documents/document1.pdf">��������� � ������������������</a></li>
                <li><a href="/documents/document2.pdf">���������������� ����������</a></li>
                <li><a href="/documents/document3.pdf">������������ ����������</a></li>
            </ul>
        </div>
    );
};

export default DocumentsPage;