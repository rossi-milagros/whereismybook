UPDATE `personas` SET `alias`= 'JUAN' WHERE `id`=2;
UPDATE `personas` SET `nombre`='LUICIANO',`apellido`='PEREYRA' WHERE `id`=3;


ALTER TABLE `personas`
    MODIFY `nombre` varchar(100) NOT NULL;
    
ALTER TABLE `personas`
    MODIFY `apellido` varchar(100) NOT NULL;

ALTER TABLE `personas`
    MODIFY `apellido` varchar(50) NOT NULL