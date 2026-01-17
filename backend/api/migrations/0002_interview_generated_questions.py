from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="interview",
            name="generated_questions",
            field=models.JSONField(blank=True, default=list),
        ),
    ]

