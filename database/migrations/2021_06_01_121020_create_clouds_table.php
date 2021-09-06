<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCloudsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('clouds', function (Blueprint $table) {
            $table->id();
			$table->string('name',255);
			$table->boolean('enabled')->default(FALSE);
			$table->enum('type', ['yandex'])->default('yandex');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('clouds');
    }
}
