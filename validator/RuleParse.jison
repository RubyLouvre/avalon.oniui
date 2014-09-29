/* description: Parses end executes mathematical expressions. */

/* lexical grammar */

%lex

%%
\s+             /* skip whitespace */
"("             return '(';
")"             return ')';
"&&"            return 'AND';
"||"            return 'OR';
"!"             return 'NOT';
[a-zA-Z0-9_\-]+ return 'RULENAME';
"[".*?"]"       return 'ARGS';
<<EOF>>         return 'EOF';

/lex

/* operator associations and precedence */

%left      'AND' 'OR'
%left      'NOT'

%start expressions

%% /* language grammar */

expressions
    : PATTERN EOF
        {return $1;}
    ;

PATTERN
        : RULES                                 {$$ = $1}
        | '(' PATTERN ')' DOP '(' PATTERN ')'   {$$ = [$2, $4, $6]}
        | NOT '(' PATTERN ')'                   {$$ = [$1, $3]}
        ;
RULES
        : RULE              {$$ = $1}
        | RULES DOP RULE    {$$ = [$1, $2, $3]}
        ;
RULE
        : RULENAME          {$$ = {name:$1}}
        | RULENAME ARGS     {$$ = {name:$1, value:$2.slice(0,$2.length-1).slice(1)}}
        | NOT RULE          {$$ = [$1, $2]}
        ;
DOP
        : AND
        | OR
        ;
%%