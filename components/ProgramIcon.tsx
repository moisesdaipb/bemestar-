import React from 'react';
import { Program } from '../types';

interface ProgramIconProps {
    program: Program;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'size-10 text-[20px]',
    md: 'size-12 text-[24px]',
    lg: 'size-14 text-[28px]',
};

const ProgramIcon: React.FC<ProgramIconProps> = ({ program, size = 'md', className = '' }) => {
    const sizeClass = sizeClasses[size];

    if (program.imagemUrl && program.icone === 'custom') {
        return (
            <div
                className={`${sizeClass} rounded-xl bg-cover bg-center shrink-0 ${className}`}
                style={{
                    backgroundImage: `url(${program.imagemUrl})`,
                    backgroundColor: program.cor
                }}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} rounded-xl flex items-center justify-center text-white shrink-0 ${className}`}
            style={{ backgroundColor: program.cor }}
        >
            <span className="material-symbols-outlined">{program.icone}</span>
        </div>
    );
};

export default ProgramIcon;
