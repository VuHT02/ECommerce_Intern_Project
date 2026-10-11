-- SQL Server rowversion được giả lập bằng binary có giá trị mặc định trong H2 test.
CREATE DOMAIN IF NOT EXISTS rowversion AS VARBINARY(8) DEFAULT X'0000000000000000';
