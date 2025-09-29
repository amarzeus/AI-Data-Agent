from sqlalchemy import create_engine

engine = create_engine('sqlite:///./ai_data_agent.db')

with engine.connect() as conn:
    conn.exec_driver_sql('DROP TABLE IF EXISTS uploaded_sales')
    conn.commit()

print('Table dropped successfully')
